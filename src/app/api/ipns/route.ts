import { getAddress } from "viem";
import { loadIpns, storeIpns } from "../../../utils/offchain-storage";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new NextResponse("Agent's addr must be provided", { status: 400 });
  }

  try {
    const ipns = await loadIpns(id);
    console.log(ipns);
    return NextResponse.json(ipns);
  } catch (e: any) {
    console.log(e);
    return new NextResponse("An error occurred", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ipns = await req.json();
    const docId = await storeIpns(ipns);
    return NextResponse.json({ id: docId });
  } catch (e: any) {
    console.log(e);
    return new NextResponse("An error occurred", { status: 500 });
  }
}
