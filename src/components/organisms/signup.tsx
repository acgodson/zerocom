import { useEffect, useRef, useState } from "react";
import {
  Button,
  Flex,
  Input,
  Text,
  Divider,
  Select,
  Box,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  HStack,
  useRadioGroup,
  InputGroup,
  InputRightAddon,
  InputLeftAddon,
} from "@chakra-ui/react";

import { ContractFactory, Contract } from "@ethersproject/contracts";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import RadioCard from "../molecules/radio-card";
import { byteCode } from "../../evm/agentBytecode";
import agentABI from "../../evm/agent.json";
import { hederaTestnet } from "viem/chains";
import { createWalletClient, custom, getAddress, toHex } from "viem";
import { getContractIdFromEvmAddress } from "@/evm/queries";
import { useDBManager } from "@/rpc";

const SignUp = ({
  isOpen,
  toggleSignup,
}: {
  isOpen: boolean;
  toggleSignup: () => void;
}) => {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "framework",
    defaultValue: "react",
    onChange: console.log,
  });

  const { user } = usePrivy();
  const { wallets } = useWallets();
  const finalRef = useRef(null);
  const [tabIndex, settabIndex] = useState(0);
  const [name, setName] = useState(
    user?.linkedAccounts.filter((x) => x.type === "google_oauth")[0].name ?? ""
  );
  const [store, setStore] = useState();
  const { createIndex } = useDBManager();

  const items = [
    {
      id: "1",
      title: "Free",
      description: "...",
    },
    {
      id: "2",
      title: "Pro",
      description: "s...",
    },
    {
      id: "3",
      title: "Enterprise",
      description: "s...",
    },
  ];

  const handleSumbit = async () => {
    const Controller_Address = process.env
      .NEXT_PUBLIC_CONTROLLER_ADDRESS as `0x${string}`;
    if (!user) {
      console.log("no address found");
      return;
    }
    if (!Controller_Address) {
      console.log("no controller contract found");
      return;
    }

    const wallet = wallets[0];
    const provider = await wallet.getEthersProvider();

    // Ensure the hex string starts with '0x'
    const formattedBytecode = `0x${byteCode}`;

    const agentFactory = new ContractFactory(
      agentABI,
      formattedBytecode,
      provider.getSigner()
    );

    console.log(Controller_Address);

    const agentContract = await agentFactory.deploy(
      getAddress(Controller_Address),
      {
        gasLimit: 15000000,
      }
    );
    await agentContract.deployTransaction.wait();
    console.log("agent contract address", agentContract.address);
    initializeAgent(agentContract.address as `0x${string}`);

    toggleSignup();
  };

  const initializeAgent = async (agentAddr: `0x${string}`) => {
    const token = process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS as `0x${string}`;
    if (!token) {
      console.log("no token found");
      return;
    }
    const ipns = await createIndex(agentAddr, token);
    if (ipns) {
      let headersList = {
        "Content-Type": "application/json",
      };

      let bodyContent = JSON.stringify({
        id: ipns.ipnsId,
        name: ipns.ipnsName,
      });

      let response = await fetch("http://www.zerocom.xyz/api/ipns", {
        method: "POST",
        body: bodyContent,
        headers: headersList,
      });

      let data = await response.json();
      if (data) {
        const id = data.id;
        const wallet = wallets[0];
        const provider = await wallet.getEthersProvider();
        const AgentContract = new Contract(
          agentAddr,
          agentABI,
          provider.getSigner()
        );
        console.log(toHex(id, { size: 32 }));
        // agent Intitialize
        let initAgent = await AgentContract.functions.initializeAgent(
          token,
          toHex(id, { size: 32 })
        );
        let initAgentTxn = await initAgent.wait();
        let initAgentTxnHash = initAgentTxn.transactionHash;
        console.log(`- https://hashscan.io/testnet/tx/${initAgentTxnHash}\n`);
      }
    }
  };

  const group = getRootProps();

  return (
    <>
      <Modal
        size={"xl"}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={toggleSignup}
      >
        <ModalOverlay
          bg="rgba(0, 0, 0, 0.6)"
          backdropFilter="blur(10px) saturate(150%)"
        />
        <ModalContent>
          <ModalHeader
            bgGradient="linear(to-r, #D82B3C, #17101C)"
            bgClip="text"
          >
            Create a New Agent
          </ModalHeader>

          <ModalBody>
            <Text color={"#333"} pb={5}>
              {tabIndex !== 1 ? (
                <>
                  Handle personalized communication campaigns and scale
                  engagement with zero's verifiable
                  <span className="text-red-400"> AI SMS plans</span>
                </>
              ) : (
                <></>
              )}
            </Text>

            <Flex direction="column" gap="3">
              {/* tab 1 */}
              {!tabIndex ? (
                <HStack {...group}>
                  {items.map((value, i) => {
                    const radio = getRadioProps({ value });
                    return (
                      <RadioCard
                        key={value.id}
                        {...radio}
                        boxShadow={i > 0 ? "none" : "sm"}
                        readOnly={i > 0 ? true : false}
                      >
                        <Box color="#333" opacity={i > 0 ? 0.3 : 1}>
                          <Text fontWeight={"bold"} fontSize={"sm"}>
                            {" "}
                            {value.title}
                          </Text>
                          <Text fontSize={"xs"}> {value.description}</Text>
                        </Box>
                      </RadioCard>
                    );
                  })}
                </HStack>
              ) : (
                <Box color={"#333"}>
                  <Divider className="my-4 w-full" orientation="horizontal" />

                  <Flex direction={"column"} gap={"4"} className="w-full">
                    <label>
                      <Text as="div" size="2" mb="1" fontWeight="bold">
                        Fee Token
                      </Text>
                      <InputGroup>
                        <InputLeftAddon>tUSDC</InputLeftAddon>
                        <Input
                          value={process.env.NEXT_PUBLIC_TEST_TOKEN_ID ?? ""}
                          _placeholder={{
                            opacity: 0.3,
                          }}
                          readOnly={true}
                        />
                      </InputGroup>
                    </label>

                    <label>
                      <Text mt={3} as="div" size="2" mb="1" fontWeight="bold">
                        Twilio Phone Number
                      </Text>
                      <InputGroup>
                        <InputLeftAddon>+1</InputLeftAddon>
                        <Input value={"7603096842"} readOnly={true} />
                      </InputGroup>
                    </label>

                    <Flex mb="1" align={"center"} className="justify-between">
                      <label>
                        <Text as="div" size="2" fontWeight="bold">
                          Region
                        </Text>
                        <Select defaultValue="UK">
                          <option value="USA"> United States</option>
                        </Select>
                      </label>

                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox defaultChecked />
                          Agree to Terms and Conditions
                        </Flex>
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              )}
            </Flex>
            <Divider
              className="my-8 w-full opacity-0"
              orientation="horizontal"
            />
          </ModalBody>

          <ModalFooter>
            {/* <Button colorScheme="blue" mr={3} onClick={toggleSignup}>
              Close
            </Button> */}
            <Button
              // variant="ghost"
              bgGradient="linear(to-r, #D82B3C, #17101C)"
              bgClip="text"
              _hover={{
                colorScheme: "red",
                bgGradient: "linear(to-r, #17101C, #D82B3C)",
                bgClip: "box",
                // color: "white",
              }}
              _focus={{
                bgGradient: "linear(to-r, #17101C, #D82B3C)",
                bgClip: false,
                // color: "white",
              }}
              _active={{
                bgGradient: "linear(to-r, #17101C, #D82B3C)",
                bgClip: false,
                // color: "white",
              }}
              onClick={
                !tabIndex ? () => settabIndex(tabIndex + 1) : handleSumbit
              }
            >
              {!tabIndex ? "Next" : "Deploy Contract"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SignUp;
