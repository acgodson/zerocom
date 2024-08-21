import { useState } from "react";
import lighthouse from "@lighthouse-web3/sdk";
//@ts-ignore
import { v4 } from "uuid";
import axios from "axios";

import {
  createPublicClient,
  encodeFunctionData,
  fromHex,
  getAddress,
  getContract,
  http,
} from "viem";

import { hederaTestnet } from "viem/chains";
import controllerABI from "./evm/controller.json";
import agentABI from "./evm/agent.json";
import { useWallets } from "@privy-io/react-auth";

const lighthouseKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY as string;

export const useDBManager = () => {
  const [collectionId, setCollectionId] = useState<`0x${string}` | null>(null);
  const { wallets } = useWallets();
  const wallet = wallets[0];
  // Public client for read-only operations
  const publicClient = createPublicClient({
    chain: hederaTestnet,
    transport: http(),
  });

  const init = async (controllerAddress: `0x${string}`) => {
    const contract = getContract({
      address: getAddress(controllerAddress),
      abi: controllerABI,
      client: publicClient,
    });

    const x = await contract.read.getUserAgent([wallet.address]);
    if (x) {
      console.log(x);
      return x;
    }
  };

  const createIndex = async (
    initialCollectionId: `0x${string}`,
    tokenAddress: string
  ) => {
    // create index on lightHouse and save bytes32 in the contract

    // Generate IPNS key using Lighthouse SDK
    const keyResponse = await lighthouse.generateKey(lighthouseKey);
    const obj = {
      ipnsName: keyResponse.data.ipnsName,
      ipnsId: keyResponse.data.ipnsId,
      version: 0,
      metadata_config: {},
      items: [],
    };

    const response = await lighthouse.uploadText(
      JSON.stringify(obj),
      lighthouseKey,
      keyResponse.data.ipnsName
    );

    if (response.data) {
      const pubResponse = await lighthouse.publishRecord(
        response.data.Hash,
        keyResponse.data.ipnsName,
        lighthouseKey
      );
    }

    const ipnsAddress = keyResponse.data.ipnsId;

    console.log("cc: ", keyResponse.data.ipnsId);
    return keyResponse.data;
  };

  const AddDocument = async (title: string, content: string) => {
    const response = await lighthouse.uploadText(content, lighthouseKey);
    const documentId = response.data.Hash;
    if (!documentId) throw new Error("Failed to upload text to IPFS");
    const provider = await wallet.getEthereumProvider();

    const data = encodeFunctionData({
      abi: agentABI,
      functionName: "addDocument",
      args: [title, documentId],
    });

    const txn = {
      data,
      to: collectionId as `0x${string}`,
      from: wallet.address,
    };

    const result = await provider.request({
      method: "eth_sendTransaction",
      params: [txn],
    });
    console.log(result);
  };

  const getCollectionPrincipal = async () => {
    if (!collectionId) throw new Error("Sign in required");
    const contract = getContract({
      address: collectionId,
      abi: agentABI,
      client: publicClient,
    });
    const x = await contract.read.getCollectionPrincipal();
    console.log("returned principal", x);
    const formatted = fromHex(x as any, {
      size: 32,
      to: "string",
    });
    return formatted;
  };

  const getIndex = async (principal: string) => {
    // Retrieve the index from lighthouse
    try {
      const response = await axios.get(
        `https://gateway.lighthouse.storage/ipns/${principal}`
      );
      const data = response.data;
      console.log("retrieved data", data);
      return data;
    } catch (e) {
      console.log("error retrieving index", e);
    }
  };

  const getMetadataList = async () => {
    if (!collectionId) throw new Error("Sign in required");
    const contract = getContract({
      address: collectionId,
      abi: agentABI,
      client: publicClient,
    });
    const x = await contract.read.getMetadataList();
    return x;
  };

  const getChunks = async (documentId: string) => {
    // Logic to retrieve chunks of a document by its ID
    try {
      const result = await getMetadata(documentId);
      if (result) {
        console.log("result from getmetadata", result);
        const response = await axios.get(
          `https://gateway.lighthouse.storage/ipfs/${(result as any).id}`
        );
        const data = response.data;
        console.log("retrieved data", data);
        return data;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getMetadata = async (documentId: string) => {
    if (!collectionId) throw new Error("Sign in required");
    const contract = getContract({
      address: collectionId,
      abi: agentABI,
      client: publicClient,
    });
    const x = await contract.read.getMetadata([documentId]);
    return x;
  };

  const getDocumentId = async (vectorId: string) => {
    /* retrieve document id using vector id */
  };

  const documentIDToTitle = async (documentId: string) => {
    if (!collectionId) throw new Error("Sign in required");
    // Logic to map a document ID to its title
    const contract = getContract({
      address: collectionId,
      abi: agentABI,
      client: publicClient,
    });
    const x = await contract.read.documentIDToTitle([documentId]);
    return x;
  };

  const titleToDocumentID = async (title: string) => {
    if (!collectionId) throw new Error("Sign in required");
    // Logic to map a title to its document ID
    const contract = getContract({
      address: collectionId,
      abi: agentABI,
      client: publicClient,
    });
    const x = await contract.read.titleToDocumentID([title]);
    return x;
  };

  //TODO: remove openAI key
  const generateEmbeddings = async (texts: string[]) => {
    // Logic to generate embeddings for a set of texts
    const key = v4();
    let headersList = {
      "idempotency-key": key,
      Authorization: `Bearer ${process.env.OPENAI_SECRET as string}`,
      "Content-Type": "application/json",
    };

    let bodyContent = JSON.stringify({
      model: "text-embedding-ada-002",
      input: texts,
    });
    let response = await fetch("https://blueband-db-442d8.web.app/api/proxy", {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    });
    let data = await response.json();
    console.log(data);
    return;
  };

  return {
    wallet,
    collectionId,
    init,
    createIndex,
    setCollectionId,
    AddDocument,
    getCollectionPrincipal,
    getIndex,
    getMetadataList,
    getChunks,
    getMetadata,
    getDocumentId,
    documentIDToTitle,
    titleToDocumentID,
    generateEmbeddings,
  };
};
