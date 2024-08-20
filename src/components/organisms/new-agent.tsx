import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, ArrowLeft, Loader } from "lucide-react";

import {
  Flex,
  Text,
  Card,
  IconButton,
  Textarea,
  Input,
  Button,
  Box,
} from "@chakra-ui/react";
import agentABI from "../../evm/agent.json";
import { Contract } from "@ethersproject/contracts";

import { useDropzone } from "react-dropzone";
import { useDBManager } from "@/rpc";
import { getAddress } from "viem";
import { useWallets } from "@privy-io/react-auth";

function NewAgent({ toggleHome }: { toggleHome: () => void }) {
  // Local State
  const [title, setTitle] = useState("");
  const [descripiton, setDescription] = useState("");
  const [file, setFile] = useState(null);
  // const [parsedContent, setParsedContent] = useState(null);
  const [JSONContent, setJSONContent] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const { wallets } = useWallets();
  const { createIndex } = useDBManager();

  const onDrop = useCallback((acceptedFiles: any) => {
    const file = acceptedFiles[0];
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".xlsx"))
    ) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        console.log(data);
        setFile(file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Please upload an Excel file (.xlsx)");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".xlsx", ".excel"],
    },
  });

  const initializeAgent = async (agentAddr: `0x${string}`) => {
    const token = process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS as `0x${string}`;
    if (!token) {
      console.log("no token found");
      return;
    }

    const index = await createIndex(agentAddr, token);

    if (index) {
      console.log(index);

      const wallet = wallets[0];
      const provider = await wallet.getEthersProvider();
      const AgentContract = new Contract(
        agentAddr,
        agentABI,
        provider.getSigner()
      );
      // agent Intitialize
      let initAgent = await AgentContract.functions.initializeAgent(
        token,
        index
      );
      let initAgentTxn = await initAgent.wait();
      let initAgentTxnHash = initAgentTxn.transactionHash;
      console.log(`\n- Transfer status: ${initAgentTxn.status}`);
      console.log(`- https://hashscan.io/testnet/tx/${initAgentTxnHash}\n`);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await initializeAgent(
        getAddress("0xf7B6132102eE614104ef9dF2A2509B059E32b5F6")
      );
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="w-full md:w-2/3">
        <div className="flex gap-3 w-full align-middle items-center">
          <IconButton
            variant="soft"
            className="cursor-pointer py-0"
            onClick={toggleHome}
            aria-label={""}
          >
            <ArrowLeft />
          </IconButton>

          <Text fontWeight="bold" size="3" className="">
            Add New Document
          </Text>
        </div>

        <Card className="mt-8" boxShadow={"xs"}>
          <Flex direction={"column"} gap={"4"} p={4} className="w-full">
            <label>
              <Text as="div" size="2" mb="1" fontWeight="bold">
                Document Title
              </Text>
              <Input
                value={JSONContent ? JSONContent.title : title}
                placeholder="e.g My Campaign Manifesto"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            {JSONContent && JSONContent.description?.length > 2 && (
              <label>
                <Text as="div" size="2" mb="1" fontWeight="bold">
                  Description
                </Text>

                <Textarea
                  value={JSONContent.description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            )}
          </Flex>
        </Card>

        <Card className="mt-8" boxShadow={"xs"}>
          <Flex direction={"column"} gap={"2"} className="w-full">
            <label>
              <Box
                px={3}
                py={2}
                className="flex w-full align-middle justify-between mb-3"
              >
                <Text as="div" size="2" mb="1" fontWeight="bold">
                  Content
                </Text>
                <Button
                  variant="soft"
                  className="cursor-pointer py-2"
                  size={"2"}
                  bg="#e3e3f2"
                  px={3}
                >
                  Download Template
                </Button>
              </Box>

              <div className="relative w-full min-h-28 cursor-pointer">
                {!JSONContent ? (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <Textarea
                      value={""}
                      className="bg-slate-50 h-full"
                      size={"3"}
                      readOnly={true}
                    />
                    <div className="absolute gap-2 flex top-0 pt-8 align-middle justify-center h-full w-full">
                      <FileSpreadsheet className="opacity-70" />
                      <Text className="opacity-70">
                        {isDragActive
                          ? "Drop CSV file here"
                          : "Drop or click to upload CSV file"}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50">
                    <Box
                      fontSize="1"
                      className="flex flex-row justify-between center"
                    >
                      <Text>{file}</Text>
                      <Text
                        size={"3"}
                        className="text-red-500"
                        onClick={() => setJSONContent(null)}
                      >
                        x
                      </Text>
                    </Box>
                  </div>
                )}
              </div>
            </label>
          </Flex>
        </Card>

        <br />
        <Button
          onClick={handleSubmit}
          className="float-right mt-4 cursor-pointer"
          borderRadius={"30px"}
          bgGradient="linear(to-r, #D82B3C, #17101C)"
          color="white"
          _hover={{
            bgGradient: "linear(to-r, #17101C, #D82B3C)",
          }}
          size={"2"}
          py={4}
          px={4}
        >
          {loading ? (
            <Loader className="animate-spin" />
          ) : (
            "Update Knowledge base"
          )}
        </Button>
      </div>
    </>
  );
}

export default NewAgent;
