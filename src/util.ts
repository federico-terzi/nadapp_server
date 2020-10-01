import Crypto from "crypto"

export const randomString = (length: number) => {  
  return Crypto
    .randomBytes(length)
    .toString('hex')
    .slice(0, length)
}

export const trimFields = (obj: any) => {
  Object.keys(obj).map(k => obj[k] = typeof obj[k] == 'string' ? obj[k].trim() : obj[k])
}