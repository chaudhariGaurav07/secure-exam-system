import {SignJWT, jwtVerify} from "jose" // jose for signing/verifying tokens

//convert JWT secret string into Uint8Array format
const secret = new TextEncoder().encode(
    process.env.JWT_SECRET
)
export async function createToken(playload: any){
    return await new SignJWT(playload)
    .setProtectedHeader({
        alg: "HS256" //algorithm haii used for signing token 
    })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret)
}

export async function verifyToken(token: string){
    try{
        const { payload } = await jwtVerify(
            token, 
            secret
        )
        return payload
    } catch (error){
        return null;
    }
}