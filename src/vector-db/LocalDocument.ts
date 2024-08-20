import { MetadataTypes } from "../utils/types";
import { LocalDocumentIndex } from "./LocalDocumentIndex";

/**
 * Represents an indexed document stored on bucket canister.
 */
export class LocalDocument {
  private readonly _index: LocalDocumentIndex;
  private readonly _id: string;
  private readonly _title: string;
  private _metadata: Record<string, MetadataTypes> | undefined;
  private _text: string | undefined;

  public constructor(index: LocalDocumentIndex, id: string, title: string) {
    this._index = index;
    this._id = id;
    this._title = title;
  }

  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public async getLength(): Promise<number> {
    const text = await this.loadText();
    if (text.length <= 40000) {
      return this._index.tokenizer.encode(text).length;
    } else {
      return Math.ceil(text.length / 4);
    }
  }

  // unimplemented
  public async hasMetadata(): Promise<boolean> {
    try {
      return false;
    } catch (err: unknown) {
      return false;
    }
  }

  //TODO: Implement metadata
  public async loadMetadata(): Promise<Record<string, MetadataTypes>> {
    if (this._metadata == undefined) {
      let json: string;
      try {
        json = "";
      } catch (err: unknown) {
        throw new Error(
          `Error reading metadata for document "${this._title}": ${(
            err as any
          ).toString()}`
        );
      }

      try {
        this._metadata = JSON.parse(json);
      } catch (err: unknown) {
        throw new Error(
          `Error parsing metadata for document "${this._title}": ${(
            err as any
          ).toString()}`
        );
      }
    }

    return this._metadata!;
  }

  public async loadText(): Promise<string> {
    if (this._text == undefined) {
      try {
        const documentID = await this._index.getDocumentId(this._title);

        if (!documentID) {
          console.log("no document ID returned");
          throw new Error();
        }

        const store = this._index.indexName;

        if (!store) {
          console.log("error no index or store id", store);
          throw new Error();
        }

        const fullDocument = await this._index._actor.getChunks(
          store,
          documentID
        );

        if (fullDocument) {
          this._text = fullDocument[0];
        }
      } catch (err: unknown) {
        throw new Error(
          `Error reading text file for document "${this.title}": ${(
            err as any
          ).toString()}`
        );
      }
    }
    return this._text || "";
  }
}
