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
} from "@chakra-ui/react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { getContractIdFromEvmAddress } from "../../evm/queries";
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
    const x = await getContractIdFromEvmAddress(addr);
    if (x) {
      setId(x);
    } else {
      setId(wallets[0].address);
    }
  };

  useEffect(() => {
    if (user && wallets && !id) {
      fetchId(wallets[0].address);
    }
  }, [user, wallets, id, ]);

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
            <Text fontSize="sm">Overview</Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Flex direction="column" gap="4">
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
                            <Flex mt="2" justify="space-between">
                              <Text fontSize="sm">Joined since:</Text>
                              <Text fontSize="sm">
                                {account.firstVerifiedAt?.toDateString()}
                              </Text>
                            </Flex>
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
                value={address ? shortenAddress(address) : ""}
                variant="filled"
                placeholder="EVM Address"
              />
            </Flex>

            <HStack>
              <Button>Top Up</Button>
              <Button rightIcon=<></>>Get ℏ HBar</Button>
            </HStack>
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
