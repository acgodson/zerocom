//@ts-ignore
import { v4 } from "uuid";
import { GPT3Tokenizer } from "./GPT3Tokenizer";
import { LocalIndex } from "./LocalIndex";
import { TextSplitter, TextSplitterConfig } from "./TextSplitter";
import {
  MetadataFilter,
  EmbeddingsModel,
  Tokenizer,
  MetadataTypes,
  QueryResult,
  DocumentChunkMetadata,
} from "../utils/types";
import { LocalDocumentResult } from "./LocalDocumentResult";
import { LocalDocument } from "./LocalDocument";
import { _SERVICE } from "../utils/vector_db_provider.did";

export interface DocumentQueryOptions {
  maxDocuments?: number;
  maxChunks?: number;
  filter?: MetadataFilter;
}

export interface LocalDocumentIndexConfig {
  actor: _SERVICE;
  indexName: string;
  apiKey: string;
  isCatalog?: boolean;
  _getDocumentId?: (documentUri: string) => Promise<string | undefined>;
  _getDocumentTitle?: (documentId: string) => Promise<string | undefined>;
  chunkingConfig?: Partial<TextSplitterConfig>;
}

export class LocalDocumentIndex extends LocalIndex {
  private readonly _tokenizer: Tokenizer;
  private _apiKey: string;
  private readonly _embeddings?: EmbeddingsModel;

  private readonly isCatalog?: boolean;
  private readonly _chunkingConfig?: TextSplitterConfig;
  private _catalog?: DocumentCatalog;
  private readonly _getDocumentId?: (
    documentUri: string
  ) => Promise<string | undefined>;
  private readonly _getDocumentTitle?: (
    documentId: string
  ) => Promise<string | undefined>;
  private _newCatalog?: DocumentCatalog;

  public constructor(config: LocalDocumentIndexConfig) {
    super(config.actor, config.indexName);
    this._apiKey = config.apiKey;
    this._chunkingConfig = Object.assign(
      {
        keepSeparators: true,
        chunkSize: 512,
        chunkOverlap: 0,
      } as TextSplitterConfig,
      config.chunkingConfig
    );
    this._tokenizer = new GPT3Tokenizer();
    this._chunkingConfig.tokenizer = this._tokenizer;
    this.isCatalog = config.isCatalog;
    this._getDocumentId = config._getDocumentId;
    this._getDocumentTitle = config._getDocumentTitle;
  }

  public get embeddings(): EmbeddingsModel | undefined {
    return this._embeddings;
  }

  public get tokenizer(): Tokenizer {
    return this._tokenizer;
  }

  public async isCatalogCreated(): Promise<boolean> {
    return this.isCatalog ?? false;
  }

  public async getDocumentId(title: string): Promise<string | undefined> {
    await this.loadIndexData();
    const x = this._getDocumentId
      ? await this._getDocumentId(title)
      : undefined;
    return x;
  }

  public async getDocumentTitle(
    documentId: string
  ): Promise<string | undefined> {
    try {
      const x = this._getDocumentTitle
        ? await this._getDocumentTitle(documentId)
        : undefined;
      return x;
    } catch (e) {
      console.log(e);
    }
  }

  public async addVectors(
    storeId: string,
    docTitle: string,
    docId: string
  ): Promise<any> {
    const recoveredChunks = await this._actor.getChunks(storeId, docId);
    if (recoveredChunks[0]) {
      const content = recoveredChunks[0];
      const result = await this.upsertDocument(docId, docTitle, content);
      return result;
    }
  }

  public async upsertDocument(
    docId: string,
    title: string,
    text: string,
    metadata?: Record<string, MetadataTypes>
  ): Promise<LocalDocument> {
    let documentId = docId;
    if (!documentId) {
      throw new Error("No document ID given");
    }

    // Split text into chunks
    const splitter = new TextSplitter();
    const chunks = splitter.split(text);

    // Break chunks into batches for embedding generation
    let totalTokens = 0;
    const chunkBatches: string[][] = [];
    let currentBatch: string[] = [];
    for (const chunk of chunks) {
      totalTokens += chunk.tokens.length;
      if (totalTokens > 8000) {
        chunkBatches.push(currentBatch);
        currentBatch = [];
        totalTokens = chunk.tokens.length;
      }
      currentBatch.push(chunk.text.replace(/\n/g, " "));
    }
    if (currentBatch.length > 0) {
      chunkBatches.push(currentBatch);
    }

    // Generate embeddings for chunks
    const embeddings: number[][] = [];
    for (const rawBatch of chunkBatches) {
      let result: any;
      const batch = this.formatBatch(rawBatch);
      console.log("this batch", batch);

      try {
        const response = await this._actor.generateEmbeddings(batch);
        if (response) {
          console.log("latest response", response);

          if ("success" in response) {
            const sortedEmbedding = JSON.parse(response.success)
              .data.sort((a: any, b: any) => a.index - b.index)
              .map((item: any) => item.embedding);

            for (const embedding of sortedEmbedding) {
              embeddings.push(embedding);
            }
          }
        }
      } catch (err: unknown) {
        throw new Error(
          `Error generating embeddings: ${(err as any).toString()}`
        );
      }
    }

    console.log("this is the embeddings before insertion", embeddings);

    // Add document chunks to index
    await this.beginUpdate();

    try {
      // Add chunks to index
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const chunkMetadata: DocumentChunkMetadata = Object.assign(
          {
            documentId,
            startPos: chunk.startPos,
            endPos: chunk.endPos,
          },
          metadata
        );
        await this.insertItem({
          id: v4(),
          metadata: chunkMetadata,
          vector: embedding,
        });
      }
      // Commit changes
      await this.endUpdate();
    } catch (err: unknown) {
      // Cancel update and raise error
      this.cancelUpdate();
      throw new Error(
        `Error adding document "${title}": ${(err as any).toString()}`
      );
    }
    // Return document
    return new LocalDocument(this, documentId, title);
  }

  public async listDocuments(): Promise<LocalDocumentResult[]> {
    // Sort chunks by document ID
    const docs: { [documentId: string]: QueryResult<DocumentChunkMetadata>[] } =
      {};
    const chunks = await this.listItems<DocumentChunkMetadata>();
    chunks.forEach((chunk) => {
      const metadata = chunk.metadata;
      //TODO: verify this
      if (
        docs[metadata.documentId] == undefined ||
        docs[metadata.documentId].length < 1
      ) {
        docs[metadata.documentId] = [];
      }
      docs[metadata.documentId].push({ item: chunk, score: chunk.norm });
    });

    // Create document results
    const results: LocalDocumentResult[] = [];
    for (const documentId in docs) {
      const title = await this.getDocumentTitle(documentId);

      const documentResult = new LocalDocumentResult(
        this,
        documentId,
        title!,
        docs[documentId],
        this._tokenizer
      );
      results.push(documentResult);
    }

    return results;
  }

  public async queryDocuments(
    queryEmbedding: any[],
    options?: DocumentQueryOptions
  ): Promise<LocalDocumentResult[]> {
    // Ensure options are defined
    options = Object.assign(
      {
        maxDocuments: 10,
        maxChunks: 1500,
      },
      options
    );

    // Check for error
    if (!queryEmbedding) {
      throw new Error(`no embeddings  found for query`);
    }

    // Query index for chunks
    const results = await this.queryItems<DocumentChunkMetadata>(
      queryEmbedding,
      options.maxChunks!,
      options.filter as any
    );

    // Group chunks by document
    const documentChunks: {
      [documentId: string]: QueryResult<DocumentChunkMetadata>[];
    } = {};

    for (const result of results) {
      const metadata = result.item.metadata;
      if (documentChunks[metadata.documentId] == undefined) {
        documentChunks[metadata.documentId] = [];
      }
      documentChunks[metadata.documentId].push(result);
    }
    // Create a document result for each document
    const documentResults: LocalDocumentResult[] = [];

    for (const documentId in documentChunks) {
      const chunks = documentChunks[documentId];
      if (documentId) {
        const title = await this.getDocumentTitle(documentId);
        if (title) {
          const documentResult = new LocalDocumentResult(
            this,
            documentId,
            title!,
            chunks,
            this._tokenizer
          );
          documentResults.push(documentResult);
        }
      }
    }

    // Sort document results by score and return top results
    return documentResults
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxDocuments!);
  }

  public async beginUpdate(): Promise<void> {
    await super.beginUpdate();
    this._newCatalog = Object.assign({}, this._catalog);
  }

  public cancelUpdate(): void {
    super.cancelUpdate();
    this._newCatalog = undefined;
  }

  public async endUpdate(): Promise<void> {
    await super.endUpdate();

    try {
      // Save catalog on smart contract
      this._catalog = this._newCatalog;
      this._newCatalog = undefined;
    } catch (err: unknown) {
      throw new Error(
        `Error saving document catalog: ${(err as any).toString()}`
      );
    }
  }

  public formatBatch(batch: any[]) {
    return batch.map((item) => item.replace(/"/g, '\\"'));
  }

  protected async loadIndexData(): Promise<void> {
    await super.loadIndexData();

    if (this._catalog) {
      return;
    }
    //creating catalog on the smart contract
    if (await this.isCatalogCreated()) {
      this._catalog = {
        version: 0,
        count: 0,
        uriToId: {},
        idToUri: {},
      };
    } else {
      this._catalog = {
        version: 0,
        count: 0,
        uriToId: {},
        idToUri: {},
      };
    }
  }
}

interface DocumentCatalog {
  version: number;
  count: number;
  uriToId: { [uri: string]: string };
  idToUri: { [id: string]: string };
}
