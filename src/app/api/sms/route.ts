import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

import { fetchQueryResponse, recordChat } from "@/evm/queries";
import { Contract } from "@ethersproject/contracts";
import { NextRequest, NextResponse } from "next/server";
import querystring from "querystring";
import twilio from "twilio";
import controllerABI from "../../../evm/controller.json";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid || "AC", authToken || "");

const retryLimit = 3; // limit for retries

// HEDERA FUNCTIONS
const tokenAddress = "";
const rpcUrl = process.env.RPC_URL as string;
const controllerAddress = process.env.CONTROLLER_ADDRESS as string;
const accountKey = process.env.ACCOUNT_PRIVATE_KEY as string;
const accountId = AccountId.fromString(process.env.ACCOUNT_ID as string);
const operatorKey = PrivateKey.fromStringECDSA(accountKey as string);

function generateRandomFourDigitNumber(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

async function sendSmsResponse(to: string, body: string, attempt = 1) {
  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER as string,
      to,
    });
    console.log(`Message sent to ${to}`);
  } catch (error) {
    console.log(
      `Failed to send message to ${to} on attempt ${attempt}: ${error}`
    );
    if (attempt < retryLimit) {
      await sendSmsResponse(to, body, attempt + 1);
    } else {
      console.log(
        `Failed to send message to ${to} after ${retryLimit} attempts`
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const req: any = await request.json();
    // const req = querystring.parse(reqText);

    const smsBody = req.Body as string;
    const fromNumber = req.From as string;

    console.log(`Received Query from ${fromNumber}: ${smsBody}`);

    if (smsBody) {
      console.log("rpc", rpcUrl);
      const rpcProvider = new JsonRpcProvider({
        skipFetchSetup: true,
        url: rpcUrl,
      });
      await rpcProvider.ready;
      const accountWallet = new Wallet(accountKey, rpcProvider);
      //  const hederaClient = Client.forTestnet().setOperator(accountId, operatorKey);

      const controllerContract = new Contract(
        controllerAddress,
        controllerABI,
        accountWallet
      );

      // Twilio has received your SMS
      const randomNumber = generateRandomFourDigitNumber();

      const result: any = await fetchQueryResponse(
        controllerContract,
        "0x2265e445aeF3F8eBfF1F3251a119FcE8030235B6", //HARDCODED AGENT
        smsBody,
        randomNumber,

        process.env.OPENAI_API_KEY as string
      );

      console.log(`Response for: ${fromNumber}`, result.text);

      const responseBody = `re: ${result.text}\n`;
      console.log(responseBody);

      // Send response back to the user DISABLED Because of Twilio policy on text account
      // await sendSmsResponse(fromNumber, responseBody);

      // Text Message Simulation
      const result2 = await recordChat(
        "k51qzi5uqu5dk5chnoeup3jzllir7tvinecgeojk0h8p62teehogj48jt2icf6", // replace with ipnsId
        smsBody,
        result.text
      );
      return NextResponse.json(result2, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "No SMS body received" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error", e },
      { status: 500 }
    );
  }
}
