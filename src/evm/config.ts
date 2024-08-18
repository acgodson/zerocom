/* eslint-disable */
import { createClient, http, defineChain } from "viem";
import { createConfig } from "@privy-io/wagmi";

export const privyConfig = {
  loginMethods: ["google", "email"],
  appearance: {
    theme: "light",
    accentColor: "#676FFF",
    logo: `http://localhost:3000/vercel.svg`,
  },
  embeddedWallets: {
    createOnLogin: "all-users",
    noPromptOnSignature: false,
  },
  walletConnectCloudProjectId: "957c795c4c86e7c46609c0cd4064fa00",
};

export const hederaTestnet = defineChain({
  id: 88882,
  name: "Chiliz Spicy Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "CHZ",
    symbol: "CHZ",
  },
  rpcUrls: {
    default: {
      http: ["https://spicy-rpc.chiliz.com/ "],
      webSocket: ["wss://spicy-rpc-ws.chiliz.com/"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://testnet.chiliscan.com/" },
  },
});

export const supportedChains = [hederaTestnet];

export const wagmiConfig = createConfig({
  //@ts-ignore
  chains: supportedChains,
  client({ chain }: { chain: any }) {
    return createClient({
      chain,
      transport: http(),
    });
  },
});
