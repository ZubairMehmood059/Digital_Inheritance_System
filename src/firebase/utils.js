import CryptoJS from "crypto-js";


const SECRET = import.meta.env.VITE_ENCRYPTION_KEY;

export const encrypt = (text) =>
  CryptoJS.AES.encrypt(text, SECRET).toString();

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};
<<<<<<< HEAD

const SECRET = import.meta.env.VITE_ENCRYPTION_KEY;
export const encrypt = (text) =>
  CryptoJS.AES.encrypt(text, SECRET).toString();
export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

=======
>>>>>>> da8dc0b (Fix Netlify deployment)
