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

import { useDropzone } from "react-dropzone";

function NewAgent({ toggleHome }: { toggleHome: () => void }) {
  // Local State
  const [title, setTitle] = useState("");
  const [descripiton, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState(null);
  const [parsedContent, setParsedContent] = useState(null);
  const [JSONContent, setJSONContent] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

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

  const handleSubmit = () => {};

  return (
    <>
      <div className="w-full md:w-2/3">
        <div className="flex gap-3 w-full align-middle">
          <IconButton
            variant="soft"
            className="cursor-pointer py-2"
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

        <Card className="mt-8"  boxShadow={"xs"}>
          <Flex direction={"column"} gap={"2"} className="w-full">
            <label>
              <div className="flex w-full align-middle justify-between mb-3">
                <Text as="div" size="2" mb="1" fontWeight="bold">
                  Content
                </Text>
                <Button
                  variant="soft"
                  className="cursor-pointer py-2"
                  size={"1"}
                >
                  Download Template
                </Button>
              </div>

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
          size={"3"}
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
