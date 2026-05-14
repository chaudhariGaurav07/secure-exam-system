
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI Missing")
}

//global mongooose cashed access kar raha hai
let chashed = (global as any).mongoose

//agar cashed nahi mila to new creatation 
if (!chashed) {
    chashed = (global as any).mongoose = {
        conn: null,
        promise: null,
    };
}

export async function connectDB() {
    if(chashed.conn) return chashed.conn
    
    if(!chashed.promise){
        chashed.promise = mongoose.connect(MONGODB_URI)
    }

    chashed.conn = await chashed.promise

    return chashed.conn // Return connected instance
}