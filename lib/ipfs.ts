//  IPFS Storage via Pinata HTTP API

const PINATA_JWT     = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud";

function getPinataHeaders() {
  if (!PINATA_JWT) {
    throw new Error(
      "PINATA_JWT must be set in .env.local — " +
      "get it from app.pinata.cloud/developers/api-keys"
    );
  }
  return {
    Authorization:  `Bearer ${PINATA_JWT}`,
    "Content-Type": "application/json",
  };
}



  // Upload encrypted content to IPFS via Pinata.
  // Returns the CID (content identifier) which is permanent and content-addressed.
 
export async function uploadToIPFS(content: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method:  "POST",
    headers: getPinataHeaders(),
    body: JSON.stringify({
      pinataContent: { data: content },
      pinataMetadata: { name: `exam-paper-${Date.now()}` },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed: ${err}`);
  }

  const json = await res.json();
  return json.IpfsHash as string; // This is the CID
}


  // Read content from IPFS via the Pinata gateway.
  // The CID is content-addressed — the same CID always returns the same data.
 
export async function readFromIPFS(cid: string): Promise<string> {
  const url = `${PINATA_GATEWAY}/ipfs/${cid}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`IPFS read failed for CID ${cid}: ${res.statusText}`);
  }

  const json = await res.json();

  // We stored the content under the 'data' key
  return json.data as string;
}