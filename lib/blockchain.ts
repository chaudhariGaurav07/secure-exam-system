import mongoose, { Schema, models } from "mongoose";
import CryptoJS from "crypto-js";

// ─ Block Schema 
const BlockSchema = new Schema(
  {
    index:        { type: Number, required: true, immutable: true },
    timestamp:    { type: Number, required: true, immutable: true },
    data:         { type: Object, required: true, immutable: true },
    previousHash: { type: String, required: true, immutable: true },
    hash:         { type: String, required: true, immutable: true },
  },
  {
    timestamps: false,
    // Prevent individual blocks from being deleted
  }
);

// Guard deletion of individual block records
BlockSchema.pre("deleteOne", function () {
  throw new Error("Blockchain blocks are immutable and cannot be deleted.");
});
BlockSchema.pre("findOneAndDelete", function () {
  throw new Error("Blockchain blocks are immutable and cannot be deleted.");
});

export const Block = models.Block || mongoose.model("Block", BlockSchema);

// Helper 
function computeHash(block: {
  index: number;
  timestamp: number;
  data: unknown;
  previousHash: string;
}): string {
  return CryptoJS.SHA256(JSON.stringify(block)).toString();
}

//  Add a new block (persisted to MongoDB)
export async function addBlock(data: any) {
  // Get the last block from the database to build the chain
  const lastBlock = await Block.findOne().sort({ index: -1 }).lean();

  const previousHash = lastBlock ? (lastBlock as any).hash : "GENESIS";
  const index        = lastBlock ? (lastBlock as any).index + 1 : 0;

  const blockPayload = {
    index,
    timestamp:    Date.now(),
    data,
    previousHash,
  };

  const hash = computeHash(blockPayload);

  const savedBlock = await Block.create({ ...blockPayload, hash });

  return savedBlock;
}

//  Verify the full chain from MongoDB 
export async function verifyBlockchain(): Promise<{
  valid: boolean;
  brokenAt?: number;
}> {
  const blocks = await Block.find().sort({ index: 1 }).lean();

  for (let i = 1; i < blocks.length; i++) {
    const current  = blocks[i]  as any;
    const previous = blocks[i - 1] as any;

    // Check the chain link
    if (current.previousHash !== previous.hash) {
      return { valid: false, brokenAt: current.index };
    }

    // Recompute and verify the hash of the previous block
    const recomputed = computeHash({
      index:        previous.index,
      timestamp:    previous.timestamp,
      data:         previous.data,
      previousHash: previous.previousHash,
    });
    if (recomputed !== previous.hash) {
      return { valid: false, brokenAt: previous.index };
    }
  }

  return { valid: true };
}