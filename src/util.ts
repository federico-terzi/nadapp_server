import Crypto from "crypto"

export const randomString = (length: number) => {  
  return Crypto
    .randomBytes(length)
    .toString('base64')
    .slice(0, length)
}

// TODO: test
export const randomDigitCode = (length: number): string => {
  let buffer = ""
  for (let i = 0; i<length; i++) {
    let randomByte = Crypto.randomBytes(1)[0]
    let digit = randomByte % 10
    buffer += digit
  }
  return buffer
}

export const trimFields = (obj: any) => {
  Object.keys(obj).map(k => obj[k] = typeof obj[k] == 'string' ? obj[k].trim() : obj[k])
}

export const generateKeyIV = (): [iv: Buffer, key: Buffer] => {
  const iv = Crypto.randomBytes(16)
  const key = Crypto.randomBytes(32)
  return [iv, key]
}

export const encryptData = (iv: Buffer, key: Buffer, data: Buffer): Buffer => {
  const cipher = Crypto.createCipheriv("aes-256-cbc", key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return encrypted
}

export const decryptData = (iv: Buffer, key: Buffer, data: Buffer): Buffer => {
  const decipher = Crypto.createDecipheriv("aes-256-cbc", key, iv)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted
}