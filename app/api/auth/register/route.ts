import { connectDB } from "@/lib/db";
import {User} from "@/models/User";
import bcrypt from "bcryptjs";


export async function POST(req: Request){
    try { 
        await connectDB();

        const body = await req.json();

        const hashPassword = await bcrypt.hash(
            body.password,
            10
        )

        const user = await User.create({
            ...body,
            password: hashPassword,
        })

        return Response.json({
            success: true,
            user,
        });
    } catch(error){
        return Response.json({
            success: false,
            error: "Registration failed",
        },
    {
        status: 5000
    })
    }
}