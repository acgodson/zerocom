import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Blueband {
  'addDocument' : ActorMethod<
    [string, string, string],
    [] | [{ 'collection' : [] | [Principal], 'documentId' : [] | [string] }]
  >,
  'documentIDToTitle' : ActorMethod<[string, string], [] | [string]>,
  'endUpdate' : ActorMethod<[string, string], undefined>,
  'generateEmbeddings' : ActorMethod<
    [Array<string>, string],
    EmbeddingsResponse
  >,
  'getChunks' : ActorMethod<[string, string], [] | [string]>,
  'getCollectionPrincipal' : ActorMethod<[string], [] | [Principal]>,
  'getDocumentId' : ActorMethod<[string, string], [] | [string]>,
  'getIndex' : ActorMethod<[string], [] | [{ 'items' : VectorStore }]>,
  'getMetadata' : ActorMethod<[string, string], [] | [DocumentMetadata__1]>,
  'getMetadataList' : ActorMethod<[string], [] | [MetadataList]>,
  'putVector' : ActorMethod<
    [string, string, string, bigint, bigint, number, Array<number>],
    string
  >,
  'titleToDocumentID' : ActorMethod<[string, string], [] | [string]>,
  'transform' : ActorMethod<[TransformArgs], HttpResponsePayload>,
  'wallet_receive' : ActorMethod<[], undefined>,
}
export type ChunkId = bigint;
export type ChunkId__1 = bigint;
export type DocumentId = string;
export type DocumentId__1 = string;
export interface DocumentMetadata {
  'id' : DocumentId,
  'chunkStartId' : ChunkId,
  'name' : string,
  'size' : bigint,
  'isEmbedded' : boolean,
  'chunkCount' : bigint,
  'chunkEndId' : ChunkId,
}
export interface DocumentMetadata__1 {
  'id' : DocumentId__1,
  'chunkStartId' : ChunkId__1,
  'name' : string,
  'size' : bigint,
  'isEmbedded' : boolean,
  'chunkCount' : bigint,
  'chunkEndId' : ChunkId__1,
}
export type EmbeddingsResponse = { 'rate_limited' : string } |
  { 'error' : string } |
  { 'success' : string };
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponsePayload {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export type MetadataList = Array<DocumentMetadata>;
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponsePayload,
}
export interface Vector {
  'id' : VectorId,
  'startPos' : bigint,
  'vector' : Array<number>,
  'documentId' : DocumentId,
  'endPos' : bigint,
}
export type VectorId = string;
export type VectorStore = Array<Vector>;
export interface _SERVICE extends Blueband {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
