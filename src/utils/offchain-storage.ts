import admin from "./firebase-config";

interface IPNS {
  id: string;
  name: string;
}

const db = admin.firestore();

// Helper function to remove undefined values
function cleanObject(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

export async function storeIpns(ipns: IPNS): Promise<string> {
  const sessionRef = db.collection("indexes");
  const doc = await sessionRef.add(
    cleanObject({
      id: ipns.id,
      shop: ipns.name,
    })
  );
  return doc.id;
}

export async function loadIpns(id: string) {
  const draftDoc = await db.collection("indexes").doc(id).get();
  if (draftDoc.exists) {
    const draftData = draftDoc.data();
    // console.log(draftData);
    if (draftData) {
      return {
        id: draftData.id,
        name: draftData.name,
      };
    }
  } else {
    throw new IpnsNotFoundError();
  }
}

export async function deleteipns(id: string) {
  await db.collection("indexes").doc(id).delete();
}

export class IpnsNotFoundError extends Error {
  constructor() {
    super("Ipns not found");
    this.name = "IpnsNotFoundError";
  }
}
