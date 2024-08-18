"use client";

import { privyConfig, wagmiConfig } from "@/evm/config";
import { WagmiProvider } from "@privy-io/wagmi";
import { PrivyClientConfig, PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProviders } from "./chakra";


const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={"clz451ibc04ptqp7hpa3i817v"}
      config={privyConfig as PrivyClientConfig}
    >
      <QueryClientProvider client={queryClient}>
        <ChakraProviders>
          <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
        </ChakraProviders>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
