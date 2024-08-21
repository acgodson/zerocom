import React, { act, useEffect, useState } from "react";
import { Loader, RefreshCwIcon } from "lucide-react";

import { Text, Button } from "@chakra-ui/react";
import QueryResponse from "@/components/organisms/query-response";
import axios from "axios";

interface Interaction {
  human_message: string;
  ai_message: string | null;
}

const QueryInterface = ({ ipnsId }: { ipnsId: string }) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      let history = [];
      const url = `https://gateway.lighthouse.storage/ipns/k51qzi5uqu5dk5chnoeup3jzllir7tvinecgeojk0h8p62teehogj48jt2icf6`;
      const response = await axios.get(url);
      const data = await response.data;
      if (data) {
        console.log("Exisitng session retrieved from: ", url);
        history = data.data;
        setInteractions(history);
        setRefreshing(false);
      }
    } catch (e) {
      console.log(e);
      setRefreshing(false);
    }
  };

  return (
    <div
      className={`flex bg-[#f4e8c9] flex-col p-2 rounded-3xl  justify-between items-center gap-10 min-h-60`}
    >
      {interactions.length === 0 ? (
        <>
          <img
            className="mt-5 rounded-full opacity-50"
            alt="query-db"
            src={"/vercel.svg"}
            width={150}
            height={150}
          />

          <Text size={"xl"} className="text-[#ac8c65]" fontWeight={"regular"}>
            <span style={{ color: "#333" }}>Send a Message: </span> +17603096842
          </Text>
        </>
      ) : (
        <div className="w-full space-y-6 mt-6">
          {interactions.map((interaction, index) => (
            <div key={index} className="border-b pb-4">
              <div className="flex justify-end">
                <p className="mb-2 py-2 px-4 text-right text-[#014338] dark:bg-[#f4e8c9]">
                  User: {interaction.human_message}
                </p>
              </div>
              {interaction.ai_message && (
                <QueryResponse text={interaction.ai_message} attachments={[]} />
              )}

              {isFetching && !interaction.ai_message && (
                <Loader className="animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleRefresh}>
        <RefreshCwIcon className={refreshing ? "animate-spin" : ""} />
      </Button>
    </div>
  );
};

export default QueryInterface;
