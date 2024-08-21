import { useState } from "react";
import {
  LucidePlusCircle,
  RefreshCwIcon,
  CheckIcon,
  CopyIcon,
} from "lucide-react";
import {
  Text,
  Button,
  Table,
  Card,
  Badge,
  Flex,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Box,
} from "@chakra-ui/react";

type DocInfo = {
  chunkCount: number;
  chunkEndId: number;
  chunkStartId: number;
  isEmbedded: boolean;
  name: string;
  document_id: string;
  size: number;
};

const OPENAI_SECRET = process.env.OPENAI_SECRET;

function Overview({ toggleHome }: { toggleHome: () => void }) {
  const [fetching, setFetching] = useState(false);
  const [docs, setDocs] = useState<any | null>(null);
  const [store, setStore] = useState<any | string>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset success message after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const fetchAgents = () => {};

  return (
    <div className="w-full">
      <div className="flex justify-between w-full">
        <Text fontWeight="bold" size="3" className="">
          Documents
        </Text>
        <Flex className="gap-3">
          <Button onClick={toggleHome} className="cursor-pointer py-2">
            <LucidePlusCircle /> Add
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer py-2"
            // onClick={() => copyToClipboard(`http://www.zerocom.xyz/${store}`)}
          >
            <CopyIcon />
            {copySuccess ? " Copied!" : ""}
          </Button>
        </Flex>
      </div>
      <Card className="mt-8">
        <div className="flex justify-between w-full items-center">
          <Badge size="3" color="indigo">
            All
          </Badge>
          <Button
            className="cursor-pointer"
            variant="soft"
            disabled={fetching}
            onClick={fetchAgents}
          >
            <RefreshCwIcon className={fetching ? "animate-spin" : ""} />
          </Button>
        </div>

        <Box my="5">
          <Table variant="simple">
            <Thead bg="gray.200">
              <Tr>
                <Th>Document</Th>
                <Th>Chunk Size</Th>
                <Th>Is Embedded</Th>
              </Tr>
            </Thead>

            <Tbody>
              {docs &&
                docs.length > 0 &&
                docs.map((doc: DocInfo, i: number) => (
                  <Tr key={i}>
                    <Td>{doc.name}</Td>
                    <Td>{doc.size}</Td>
                    <Td>
                      {!doc.isEmbedded ? (
                        <Button size="sm">Save</Button>
                      ) : (
                        <Button size="sm" isDisabled variant="ghost">
                          <CheckIcon />
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </Box>
      </Card>
      {/* alert dialog for vectorizing this */}
    </div>
  );
}

export default Overview;
