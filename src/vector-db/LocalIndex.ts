//@ts-ignore
import { v4 } from "uuid";
import { ItemSelector } from "./ItemSelector";

import {
  IndexItem,
  MetadataFilter,
  MetadataTypes,
  QueryResult,
} from "../utils/types";
import { _SERVICE } from "../utils/vector_db_provider.did";

/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
export class LocalIndex {
  private readonly _indexName: string | undefined;
  public _actor: _SERVICE;
  private _data?: IndexData;
  private _update?: IndexData;

  /**
   * Creates a new instance of LocalIndex.

   * @param actor IC Actor
   * @param indexName Optional name of vector-store.
   */
  public constructor(actor: _SERVICE, indexName?: string) {
    this._indexName = indexName;
    this._actor = actor;
  }

  /**
   * Optional name of the index store.
   */
  public get indexName(): string | undefined {
    return this._indexName;
  }

  public get actor(): _SERVICE | undefined {
    return this._actor;
  }

  /**
   * Begins an update to the index.
   * @remarks
   * This method loads the index into memory and prepares it for updates.
   */
  public async beginUpdate(): Promise<void> {
    if (this._update) {
      throw new Error("Update already in progress");
    }

    await this.loadIndexData();
    if (this._data) {
      this._update = Object.assign({}, this._data);
    }
  }

  /**
   * Cancels an update to the index.
   * @remarks
   * This method discards any changes made to the index since the update began.
   */
  public cancelUpdate(): void {
    this._update = undefined;
  }

  /**
   * Ends an update to the index.
   * @remarks
   * This method updates the index on the cannister.
   */
  public async endUpdate(): Promise<void> {
    if (!this._update) {
      throw new Error("No update in progress");
    }
    if (!this._actor) {
      throw new Error("No actor found at endUpdate");
    }
    try {
      // Loop through all items in the update
      for (const item of this._update.items) {
        console.log("testing norm", item.vector);

        // Insert each vector to the canister
        const vectorId = await this._actor.putVector(
          this.indexName,
          item.metadata.documentId.toString(),
          item.id,
          BigInt(item.metadata.startPos),
          BigInt(item.metadata.endPos),
          item.norm,
          item.vector
        );
        // Step 3: Handle successful publication
        if (vectorId) {
          console.log("vector added: ", vectorId);
          this._data = this._update;
          this._update = undefined;
        } else {
          throw new Error("Failed to update index");
        }
      }
    } catch (err) {
      throw new Error(
        `Error commiting vector to cannister: ${(err as Error).message}`
      );
    }
  }

  /**
   * Loads an index from disk and returns its stats.
   * @returns Index stats.
   */
  public async getIndexStats(): Promise<any> {
    await this.loadIndexData();
    return {
      metadata_config: this._data!.metadata_config,
      items: this._data!.items.length,
    };
  }

  /**
   * Returns an item from the index given its ID.
   * @param id ID of the item to retrieve.
   * @returns Item or undefined if not found.
   */
  public async getItem<TMetadata = Record<string, MetadataTypes>>(
    id: string
  ): Promise<IndexItem<TMetadata> | undefined> {
    await this.loadIndexData();
    return this._data!.items.find((i) => i.id === id) as any | undefined;
  }

  /**
   * Adds an item to the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, an error will be thrown.
   * @param item Item to insert.
   * @returns Inserted item.
   */
  public async insertItem<TMetadata = Record<string, MetadataTypes>>(
    item: Partial<IndexItem<TMetadata>>
  ): Promise<IndexItem<TMetadata>> {
    if (this._update) {
      return (await this.addItemToUpdate(item, true)) as any;
    } else {
      await this.beginUpdate();
      const newItem = await this.addItemToUpdate(item, true);
      await this.endUpdate();
      return newItem as any;
    }
  }

  /**
   * Returns true if the index exists.
   */
  public async isIndexCreated(
    indexName: any | undefined //store name
  ): Promise<boolean> {
    try {
      if (!indexName) {
        console.log("error, no index or collection name  given");
        return false;
      }
      const data = await this._actor.getMetadataList(indexName);
      if (data[0]) {
        return true;
      } else {
        false;
      }
      return false;
    } catch (err: unknown) {
      console.error("Error checking if index is created:", err);
      return false;
    }
  }

  /**
   * Returns all items in the index.
   * @remarks
   * This method loads the index into memory and returns all its items. A copy of the items
   * array is returned so no modifications should be made to the array.
   * @returns Array of all items in the index.
   */
  public async listItems<TMetadata = Record<string, MetadataTypes>>(): Promise<
    IndexItem<TMetadata>[]
  > {
    await this.loadIndexData();
    return this._data!.items.slice() as any;
  }

  /**
   * Finds the top k items in the index that are most similar to the vector.
   * @remarks
   * This method loads the index into memory and returns the top k items that are most similar.
   * An optional filter can be applied to the metadata of the items.
   * @param vector Vector to query against.
   * @param topK Number of items to return.
   * @param filter Optional. Filter to apply.
   * @returns Similar items to the vector that matche the supplied filter.
   */
  public async queryItems<TMetadata = Record<string, MetadataTypes>>(
    vector: number[],
    topK: number,
    filter?: MetadataFilter
  ): Promise<QueryResult<TMetadata>[]> {
    await this.loadIndexData();

    // Filter items
    let items = this._data!.items;

    if (filter) {
      items = items.filter((i) => ItemSelector.select(i.metadata, filter));
    }

    // Calculate distances
    const norm = ItemSelector.normalize(vector);
    const distances: { index: number; distance: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const distance = ItemSelector.normalizedCosineSimilarity(
        vector,
        norm,
        item.vector,
        item.norm
      );
      distances.push({ index: i, distance: distance });
    }

    // Sort by distance DESCENDING
    distances.sort((a, b) => b.distance - a.distance);

    // Find top k
    const top: QueryResult<TMetadata>[] = distances.slice(0, topK).map((d) => {
      return {
        item: Object.assign({}, items[d.index]) as any,
        score: d.distance,
      };
    });

    return top;
  }

  /**
   * Ensures that the index has been loaded into memory.
   */
  protected async loadIndexData(): Promise<void> {
    if (!this._data && !this._indexName) {
      return;
    }

    if (!(await this.isIndexCreated(this._indexName))) {
      throw new Error("Index does not exist or is empty");
    }

    try {
      const storeId: any = this._indexName;

      if (!storeId) {
        console.log("no valid collection found");
        return;
      }
      const vectors = await this._actor.getIndex(storeId);

      if (!vectors[0]) {
        console.log("no vectors found in index", vectors);
        return;
      }

      if (vectors[0]) {
        const result = vectors[0].items;

        if (result.length > 0) {
          this._data = {
            collectionId: storeId,
            items: result.map((item: any) => ({
              id: item.id,
              metadata: {
                documentId: item.documentId,
                startPos: Number(item.startPos),
                endPos: Number(item.endPos),
              },
              vector: item.vector,
              norm: item.norm,
            })),
          };
        } else {
          this._data = {
            collectionId: storeId,
            items: [],
          };
        }
      }
    } catch (error) {
      throw new Error("Failed to load index data");
    }
  }

  private async addItemToUpdate(
    item: Partial<IndexItem<any>>,
    unique: boolean
  ): Promise<IndexItem> {
    // Ensure vector is provided
    if (!item.vector) {
      throw new Error("Vector is required");
    }

    // Ensure unique
    const id = item.id ?? v4();

    if (unique) {
      const existing = (this._update?.items || []).find(
        (i) => i.id && i.id === id
      );
      if (existing) {
        throw new Error(`Item with id ${id} already exists`);
      }
    }

    // Check for indexed metadata
    let metadata: Record<string, any> = {};
    if (this._update && item.metadata) {
      metadata = item.metadata;
    } else if (item.metadata) {
      metadata = item.metadata;
    }

    // Create new item
    const newItem: IndexItem = {
      id: id,
      metadata: metadata,
      vector: item.vector,
      norm: ItemSelector.normalize(item.vector),
    };

    // Add item to index
    if (!unique) {
      const existing = (this._update?.items || []).find(
        (i) => i.id && i.id === id
      );
      if (existing) {
        existing.metadata = newItem.metadata;
        existing.vector = newItem.vector;
        existing.metadataFile = newItem.metadataFile;
        return existing;
      } else {
        this._update?.items.push(newItem);
        console.log("this item was added", newItem);
        return newItem;
      }
    } else {
      this._update?.items.push(newItem);
      console.log("item was added", newItem);
      return newItem;
    }
  }
}

interface IndexData {
  collectionId: string;
  metadata_config?: {
    indexed?: string[];
  };
  items: IndexItem[];
}
