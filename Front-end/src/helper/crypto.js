import CryptoJS from 'crypto-js';

export const encryptAES = (object, key) => {
    const jsonData = JSON.stringify(object);
    const ciphertext = CryptoJS.AES.encrypt(jsonData, key).toString();

    return ciphertext;
}

export const decryptAES = (ciphertext, key) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    return decryptedData;
}
