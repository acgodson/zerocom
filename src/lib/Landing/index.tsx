"use client";

import { useEffect, useState } from "react";
import { Flex, Text, Button, Box, Heading } from "@chakra-ui/react";
import { LockKeyholeOpen } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

import { useEthContext } from "../../evm/EthContext";
import AuroraBackground from "@/components/atoms/aurora-background";
import Header from "@/components/organisms/header";

function Welcome() {
  const { isConnected, address } = useAccount();
  const { user, authenticated } = usePrivy();
  const { handleLogin, toggleAccountModal } = useEthContext();

  return (
    <>
      <main className="flex w-screen" style={{ minHeight: "100vh" }}>
        <Box px={[0, 0, 32]}>
          <AuroraBackground className="flex flex-col gap-2 w-full max-w-[750px]">
            <Header />
            <Box className="mt-12   pb-6 flex flex-col h-full justify-start min-h-96 px-6">
              <Box className=" bg-transparent py-2" maxWidth="">
                <Heading
                  size={["3xl", "4xl"]}
                  color="#D82B3C"
                  fontWeight={"medium"}
                >
                  <span className="text-[#020202]">
                    {" "}
                    Let Everyone
                    <span className="text-[#D82B3C]">in-</span>
                    <br />
                    the{" "}
                  </span>{" "}
                  Conversation
                  <br />
                </Heading>
              </Box>
              <br />
              <br />
              <Box className="py-2" maxWidth="">
                <br />
                <br />

                <Box className="flex flex-col sm:flex-row justify-between gap-4 w-full mx-0">
                  {!address ? (
                    <Button
                      size={"8"}
                      fontSize={"xl"}
                      borderRadius={"30px"}
                      bgGradient="linear(to-r, #D82B3C, #17101C)"
                      color="white"
                      _hover={{
                        bgGradient: "linear(to-r, #17101C, #D82B3C)",
                      }}
                      className="w-full sm:w-[48%]  py-5 cursor-pointer"
                      onClick={handleLogin}
                    >
                      Sign in to Create
                    </Button>
                  ) : (
                    <Button
                      variant={"outline"}
                      bgGradient="linear(to-r, #D82B3C, #17101C)"
                      color="white"
                      _hover={{
                        bgGradient: "linear(to-r, #17101C, #D82B3C)",
                      }}
                      className="w-full sm:w-[48%] bg-[#014338] min-w-full  py-5 cursor-pointer"
                    >
                      <Box>
                        {/* <BearAvatar size="2" did={address} /> */}
                        <LockKeyholeOpen color="#f4e8c9" />
                      </Box>
                      <span className="text-[#f4e8c9]"> SIWE Verify</span>
                    </Button>
                  )}
                  {/* 
            <Box className="w-full sm:w-[48%] cursor-pointer">
              <SignUp />
            </Box> */}
                </Box>
              </Box>
            </Box>
          </AuroraBackground>
        </Box>
      </main>
    </>
  );
}

export default Welcome;
