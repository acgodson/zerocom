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
  InputGroup,
  InputLeftAddon,
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
            <Text color="#333">Profile</Text>
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
                            <Text fontWeight="bold" textAlign="left">
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

              <InputGroup>
                <InputLeftAddon>Account ID</InputLeftAddon>
                <Input
                  isReadOnly
                  value={id ?? ""}
                  variant="filled"
                  placeholder="Acount ID"
                />
              </InputGroup>

              <InputGroup>
                <InputLeftAddon fontWeight="semibold" fontSize={"xs"}>
                  EVM address
                </InputLeftAddon>
                <Input
                  isReadOnly
                  color={"#333"}
                  fontSize={"xs"}
                  value={address ? address : ""}
                  variant="filled"
                  placeholder="EVM Address"
                />
              </InputGroup>
            </Flex>

            <VStack mt={8} color="#333" w="100%">
              {/* <Text fontSize={"xs"}> Balance</Text> */}

              <Flex
                w="100%"
                alignItems={"center"}
                justifyContent={"space-between"}
              >
                <Text fontSize={["xs", "sm"]}>
                  {" "}
                  My Agent:<b> 0.00 tUSDC</b>
                </Text>
                <Box>
                  <Button
                    w={["fit-content", "130px"]}
                    size="sm"
                    className="bg-zinc-900 text-white"
                    py={4}
                    onClick={() => {}}
                  >
                    Top Up
                  </Button>
                </Box>
              </Flex>
              <br />
              <Flex
                alignItems={"center"}
                display="flex"
                w="full"
                justifyContent={"space-between"}
                fontSize={["xs", "sm"]}
              >
                <Text>
                  Budget Cap:<b> 0.00</b>
                </Text>
                <Button
                  w="fit-content"
                  size="sm"
                  className="bg-zinc-900 text-white"
                  py={1}
                >
                  +
                </Button>
              </Flex>

              <Box px={3} mt={4} color="#333">
                <Divider />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter w="full" justifyContent="space-between">
            <Button w="160px" py={4} rightIcon={<ExternalLink />}>
              ℏ Faucet
            </Button>
            <Button colorScheme="red" onClick={handleLogout}>
              Log out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
