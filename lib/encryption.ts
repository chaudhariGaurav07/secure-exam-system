import CryptoJS from 'crypto-js';

const SECRET = process.env.ENCRYPTION_SECRET!;

if (!SECRET) {
    throw new Error("ENCRYPTION_SECRET Missing");
}

export function encrypt(text: string){
    return CryptoJS.AES.encrypt(
        text,
        SECRET
    ).toString();   
}

export function decrypt(cipher: string){
    const bytes = CryptoJS.AES.decrypt(
        cipher,
        SECRET
    );
    
     return bytes.toString(CryptoJS.enc.Utf8);
}

export function createHash(text: string) {
  return CryptoJS.SHA256(text).toString();
}