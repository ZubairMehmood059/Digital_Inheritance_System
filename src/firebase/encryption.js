import CryptoJS from "crypto-js";

const SECRET = import.meta.env.VITE_ENCRYPTION_KEY || "default_fallback_secret_key_123";

export const encrypt = (text) => {
  if (!text) return "";
  return CryptoJS.AES.encrypt(text, SECRET).toString();
};

export const decrypt = (ciphertext) => {
  if (!ciphertext) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed", error);
    return "";
  }
};
