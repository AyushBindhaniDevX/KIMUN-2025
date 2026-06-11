import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 })
    }

    const response = await fetch(url)
    if (!response.ok) {
      return new NextResponse(`Failed to fetch remote document: ${response.statusText}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('Error proxying document fetch:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
