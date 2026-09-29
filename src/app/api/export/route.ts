import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import http from 'http'

export const runtime = 'nodejs'

const API_BASE = process.env.API_BASE_URL as string

function fetchBinary(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const client = isHttps ? https : http

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        ...headers,
      },
    }

    if (body) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(body)),
      }
    }

    const req = client.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode || 200,
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'application/octet-stream',
        })
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, payload, method: requestedMethod } = body

    if (!endpoint) {
      return NextResponse.json({ success: false, message: 'Missing endpoint' }, { status: 400 })
    }

    // Backend rule: /dropdown/* endpoints and /*/show endpoints are GET. All CRUD (list, create, update, delete) endpoints use POST.
    const isGetEndpoint =
      endpoint.startsWith('/dropdown/') ||
      endpoint.endsWith('/show') ||
      endpoint.includes('/show/')

    const httpMethod = requestedMethod || (isGetEndpoint ? 'GET' : 'POST')
    let url = `${API_BASE}${endpoint}`
    const token = request.headers.get('authorization') || ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    }

    let reqBody: string | undefined
    if (payload && typeof payload === 'object') {
      reqBody = JSON.stringify(payload)
      if (httpMethod === 'GET') {
        const params = new URLSearchParams()
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params.append(k, String(v))
          }
        })
        const q = params.toString()
        if (q) url += (url.includes('?') ? '&' : '?') + q
      }
    }

    const res = await fetchBinary(url, httpMethod, headers, reqBody)

    return new NextResponse(new Uint8Array(res.buffer), {
      status: res.status,
      headers: {
        'Content-Type': res.contentType,
        'Content-Disposition': 'attachment',
      },
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 })
  }
}