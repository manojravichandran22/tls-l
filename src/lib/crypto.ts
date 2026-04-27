import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.CRYPTO_SECRET_KEY as string

export const encrypt = (data: unknown): string =>
  CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()

export const decrypt = (cipher: string): unknown => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

export const encryptPayload = (data: unknown): { data: string } => ({
  data: encrypt(data),
})
