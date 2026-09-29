import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import http from 'http'

export const runtime = 'nodejs'

const API_BASE = process.env.API_BASE_URL as string

function fetchBinary(
  url: string,
  headers: Record<string, string>
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const client = isHttps ? https : http

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { ...headers },
      rejectUnauthorized: false,
    }

    const req = client.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode || 200,
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      })
    })

    req.on('error', reject)
    req.end()
  })
}

export async function GET(request: NextRequest) {
  try {
    const fileUrl = request.nextUrl.searchParams.get('url')
    if (!fileUrl) {
      return NextResponse.json({ success: false, message: 'Missing url parameter' }, { status: 400 })
    }

    let targetUrl = fileUrl
    if (fileUrl.startsWith('/')) {
      targetUrl = `${API_BASE}${fileUrl}`
    }

    const res = await fetchBinary(targetUrl, {})

    const fileName = targetUrl.split('/').pop()?.split('?')[0] || 'download.xlsx'

    return new NextResponse(new Uint8Array(res.buffer), {
      status: res.status,
      headers: {
        'Content-Type': res.contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Download failed' }, { status: 500 })
  }
}
