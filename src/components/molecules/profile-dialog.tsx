import { useState, useEffect } from "react";
import { useEthContext } from "@/evm/EthContext";
import {
  Box,
  Button,
  Flex,
  Divider,
  Input,
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { usePrivy } from "@privy-io/react-auth";
import { ExternalLink } from "lucide-react";
import { useAccount } from "wagmi";
import { getAccountIdFromEvmAddress } from "../../evm/queries";
import { useWallets } from "@privy-io/react-auth";

import BearAvatar from "../atoms/bear-avatar";
import { shortenAddress } from "../../utils";

export default function ProfileDialog() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { isAccountModalOpen, toggleAccountModal, handleLogout } =
    useEthContext();
  const [id, setId] = useState<string | null>(null);

  const fetchId = async (addr: string) => {
    const x = await getAccountIdFromEvmAddress(addr);
    if (x) {
      setId(x);
    } else {
      setId(wallets[0].address);
    }
  };

  useEffect(() => {
    if (wallets && wallets.length > 0 && !id) {
      fetchId(wallets[0].address);
    }
  }, [user, wallets, id]);

  return (
    <>
      <Modal
        isOpen={isAccountModalOpen}
        onClose={toggleAccountModal}
        isCentered
      >
        <ModalOverlay
          bg="whiteAlpha.200"
          backdropFilter="blur(8px)"
          zIndex="40"
        />
        <ModalContent>
          <ModalHeader>
            Profile
            <Text color="#333">Overview</Text>
          </ModalHeader>
          <ModalCloseButton className="text-[#333]" />

          <ModalBody>
            <Flex direction="column" color="#333" gap="4">
              <Box p="4" bg="gray.200" rounded="md">
                <Flex align="center" gap="3">
                  {/* Replace BearAvatar with your Avatar component */}
                  <Box bg="gray.400" w="40px" h="40px" borderRadius="50%" />

                  <Box>
                    {user &&
                      user?.linkedAccounts
                        .filter((x) => x.type === "google_oauth")
                        .map((account, i) => (
                          <Box key={i}>
                            <Text fontWeight="bold" textAlign="center">
                              {account.name}
                            </Text>
                            <Text textAlign="center" fontWeight="bold">
                              {account.email}
                            </Text>
                            {/* <Flex mt="2" justify="space-between">
                              <Text fontSize="sm">Joined since:</Text>
                              <Text fontSize="sm">
                                {account.firstVerifiedAt?.toDateString()}
                              </Text>
                            </Flex> */}
                          </Box>
                        ))}
                  </Box>
                </Flex>
              </Box>

              <Input
                isReadOnly
                value={id ?? ""}
                variant="filled"
                placeholder="Acount ID"
              />

              <Input
                isReadOnly
                color={"#333"}
                fontSize={"xs"}
                value={address ? address : ""}
                variant="filled"
                placeholder="EVM Address"
              />
            </Flex>

            <VStack mt={8} color="#333" w="100%">
              {/* <Text fontSize={"xs"}> Balance</Text> */}

              <Flex
                w="100%"
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Text fontSize={"sm"}>
                  {" "}
                  My Agent:<b> 0.00 tUSDC</b>
                  <br />                     
                  Budget:<b> 0.00</b>
                </Text>
                <Box>
                  <Button
                    w="130px"
                    size="sm"
                    className="bg-zinc-900 text-white"
                    py={4}
                  >
                    Top Up
                  </Button>

                  <Button
                    w="fit-content"
                    size="sm"
                    className="bg-zinc-900 text-white"
                    py={4}
                  >
                    +
                  </Button>
                </Box>
              </Flex>
              <Box px={3} mt={4} color="#333">
                <Divider />
              </Box>

              <Flex
                w="100%"
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Text fontSize={"sm"}>{/* ℏ: <b> 0.00</b>{" "} */}</Text>
                <Button w="160px" py={4} rightIcon={<ExternalLink />}>
                  ℏ Faucet
                </Button>
              </Flex>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" onClick={handleLogout}>
              Log out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
