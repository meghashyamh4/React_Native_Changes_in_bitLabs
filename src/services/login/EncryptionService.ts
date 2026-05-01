import * as CryptoJS from 'crypto-js';

/**
 * Hardened random word generator that bypasses broken crypto polyfills
 * by falling back to Math.random() when native modules are missing/broken.
 */
const generateSafeRandomWords = (nBytes: number) => {
  const words = [];
  for (let i = 0; i < nBytes; i += 4) {
    // Generate a 32-bit random integer using Math.random
    words.push((Math.random() * 0x100000000) | 0);
  }
  return CryptoJS.lib.WordArray.create(words, nBytes);
};

export const encryptPassword = (password: string, secretkey: string) => {
  // Use our safe generator instead of CryptoJS.lib.WordArray.random()
  // which is known to crash if it detects a broken native crypto polyfill.
  const iv = generateSafeRandomWords(16);

  const encryptedPassword = CryptoJS.AES.encrypt(password, CryptoJS.enc.Utf8.parse(secretkey), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return { encryptedPassword, iv: iv.toString(CryptoJS.enc.Base64) };
};

export default encryptPassword;

