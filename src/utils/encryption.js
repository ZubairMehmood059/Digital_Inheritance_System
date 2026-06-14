import CryptoJS from "crypto-js";

const SECRET = import.meta.env.VITE_ENCRYPTION_KEY || "FinalHandover@SecretKey2024";

export const encrypt = (text) => {
  try {
    if (!text) return "";
    return CryptoJS.AES.encrypt(String(text), SECRET).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return text || "";
  }
};

export const decrypt = (ciphertext) => {
  try {
    if (!ciphertext) return "";
    const bytes = CryptoJS.AES.decrypt(String(ciphertext), SECRET);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || ciphertext;
  } catch (error) {
    console.error("Decryption failed:", error);
    return ciphertext || "";
  }
};