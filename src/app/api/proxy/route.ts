import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import https from 'https'
import http from 'http'

export const runtime = 'nodejs'

const API_BASE = process.env.API_BASE_URL as string
const SECRET_KEY = process.env.CRYPTO_SECRET_KEY as string

function encryptData(data: unknown): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}

function makeRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const client = isHttps ? https : http

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: { ...headers },
    }

    if (body) {
      options.headers = {
        ...options.headers,
        'Content-Length': String(Buffer.byteLength(body)),
      }
    }

    const req = client.request(options, (res) => {
      let responseData = ''
      res.on('data', (chunk: Buffer) => (responseData += chunk.toString()))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 200, data: JSON.parse(responseData) })
        } catch {
          resolve({ status: res.statusCode || 500, data: { success: false, message: 'Invalid response' } })
        }
      })
    })

    req.on('error', (err) => reject(err))
    if (body) req.write(body)
    req.end()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, method = 'POST', payload, encrypt: shouldEncrypt } = body

    if (!endpoint) {
      return NextResponse.json({ success: false, message: 'Missing endpoint' }, { status: 400 })
    }

    const url = `${API_BASE}${endpoint}`
    const token = request.headers.get('authorization') || ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = token

    let reqBody: string | undefined

    if (payload) {
      if (shouldEncrypt) {
        headers['x-encrypted'] = 'true'
        reqBody = JSON.stringify({ data: encryptData(payload) })
      } else {
        reqBody = JSON.stringify(payload)
      }
    }

    const res = await makeRequest(url, method.toUpperCase(), headers, reqBody)

    return NextResponse.json(res.data, { status: res.status })
  } catch {
    return NextResponse.json({ success: false, message: 'Proxy request failed' }, { status: 500 })
  }
}
