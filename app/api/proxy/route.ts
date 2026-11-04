import { NextRequest, NextResponse } from 'next/server'

const REFERER = 'https://yenime.net/'

export const runtime = 'edge' // Use Edge runtime for better performance and no timeouts
export const dynamic = 'force-dynamic'

// Helper to try extracting original URL from neonflix proxy
function tryExtractOriginalUrl(proxyUrl: string): string | null {
  try {
    // Pattern: https://proxy2.neonflix.st/h/{token}/{base64}/{path}
    // The path after base64 is relative to the URL inside the base64
    const match = proxyUrl.match(/neonflix\.st\/h\/[^\/]+\/([^\/]+)(?:\/(.+))?/)
    if (!match) return null
    
    let base64Part = match[1]
    const pathPart = match[2] || '' // May be empty for master playlist
    
    // Add padding if needed
    while (base64Part.length % 4 !== 0) {
      base64Part += '='
    }
    
    // Try to decode base64
    const decoded = atob(base64Part)
    
    // The decoded part contains lines with URLs
    const lines = decoded.split('\n').filter(line => line.trim().startsWith('http'))
    
    if (lines.length > 0) {
      // Use the last URL which is usually the actual CDN
      let baseUrl = lines[lines.length - 1].trim()
      
      if (pathPart) {
        // If there's a path part, resolve it relative to the base URL
        // Remove the filename from baseUrl to get the directory
        const lastSlash = baseUrl.lastIndexOf('/')
        const directory = baseUrl.substring(0, lastSlash + 1)
        return directory + pathPart
      } else {
        // No path part means this IS the master playlist
        return baseUrl
      }
    }
    
    return null
  } catch (e) {
    console.error('Failed to extract original URL:', e)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Try to extract original URL if this is a neonflix proxy URL
    let targetUrl = url
    let extractedFromProxy = false
    let originalNeonflixUrl = url
    
    if (url.includes('neonflix.st')) {
      const originalUrl = tryExtractOriginalUrl(url)
      if (originalUrl) {
        targetUrl = originalUrl
        extractedFromProxy = true
      }
    }
    
    // Build upstream headers
    const upstreamHeaders: HeadersInit = {
      'Referer': extractedFromProxy ? 'https://nexabloom.top/' : REFERER,
      'Origin': extractedFromProxy ? 'https://nexabloom.top' : 'https://yenime.net',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    // Forward Range header for seeking support
    const rangeHeader = request.headers.get('Range')
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    let response = await fetch(targetUrl, {
      headers: upstreamHeaders,
      redirect: 'follow',
    })
    
    // If extracted URL failed with 403/401, try neonflix as fallback
    if (extractedFromProxy && (response.status === 403 || response.status === 401)) {
      // Reset headers for neonflix
      upstreamHeaders['Referer'] = REFERER
      upstreamHeaders['Origin'] = 'https://yenime.net'
      
      response = await fetch(originalNeonflixUrl, {
        headers: upstreamHeaders,
        redirect: 'follow',
      })
      
      // Update for error reporting
      targetUrl = originalNeonflixUrl
      extractedFromProxy = false
    }

    if (!response.ok && response.status !== 206) {
      // Try to get error details from upstream
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch (e) {
        errorBody = 'Could not read error response'
      }
      
      console.error(`[PROXY] Upstream error: ${response.status} ${response.statusText}`, {
        url: targetUrl.substring(0, 100),
        wasExtracted: extractedFromProxy,
      })
      
      // If this was from neonflix and failed, mention it
      let errorMessage = `Upstream error: ${response.status} ${response.statusText}`
      if (url.includes('neonflix.st') && !extractedFromProxy) {
        errorMessage += ' (neonflix proxy is blocking requests)'
      } else if (extractedFromProxy) {
        errorMessage += ' (extracted CDN URL failed, may need authentication)'
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: errorMessage,
          url: url,
          targetUrl: extractedFromProxy ? targetUrl : undefined,
          details: errorBody.substring(0, 200),
        }), 
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    
    // Detect if this is a playlist
    const isPlaylist = 
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      url.includes('.m3u8') ||
      url.endsWith('master.m3u8') ||
      url.endsWith('index.m3u8')

    // If it's an m3u8 playlist, rewrite URLs to go through our proxy
    if (isPlaylist) {
      const text = await response.text()
      const rewritten = rewritePlaylist(text, url)

      return new NextResponse(rewritten, {
        status: response.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
          'Cache-Control': 'no-store',
        },
      })
    }

    // For video segments, subtitles, and other files, stream through
    const responseHeaders = new Headers()
    
    // Detect video segments (they might be served as text/html incorrectly or have no extension)
    let finalContentType = contentType
    const isVideoSegment = 
      url.includes('.ts') || 
      url.includes('.m4s') || 
      url.includes('seg-') ||
      /\/v\d+\/\d+$/.test(url) || // Pattern: /v0/0, /v1/123, etc.
      /\/\d+$/.test(url) // Pattern: ending with just a number
    
    if (isVideoSegment && (contentType.includes('text/html') || contentType.includes('text/plain') || !contentType || contentType === 'application/octet-stream')) {
      // Force video/mp2t for HLS segments
      finalContentType = 'video/mp2t'
    } else if (!contentType || contentType === 'application/octet-stream') {
      // Guess content type based on URL
      if (url.includes('.ts')) finalContentType = 'video/mp2t'
      else if (url.includes('.m4s')) finalContentType = 'video/iso.segment'
      else if (url.includes('.vtt')) finalContentType = 'text/vtt'
      else if (url.includes('.srt')) finalContentType = 'text/plain'
      else finalContentType = contentType || 'application/octet-stream'
    }
    
    responseHeaders.set('Content-Type', finalContentType)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', '*')
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type')
    
    // Forward Range response headers for seeking
    if (response.status === 206) {
      const contentRange = response.headers.get('Content-Range')
      if (contentRange) {
        responseHeaders.set('Content-Range', contentRange)
      }
    }
    
    // Cache segments aggressively
    const isSegment = 
      url.includes('.ts') || 
      url.includes('.m4s') || 
      url.includes('seg-') ||
      /\/v\d+\/\d+$/.test(url) || // Pattern: /v0/0, /v1/123
      /\/\d+$/.test(url) // Pattern: ending with just a number
    
    if (isSegment) {
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      responseHeaders.set('Cache-Control', 'no-store')
    }
    
    const contentLength = response.headers.get('Content-Length')
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy fetch error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch resource',
        message: error instanceof Error ? error.message : String(error),
        url: url,
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}

function rewritePlaylist(text: string, baseUrl: string): string {
  // Get the base directory of the playlist URL
  const base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1)
  
  return text.split('\n').map(line => {
    const trimmed = line.trim()
    
    // Handle tag lines with URI= attributes (for encryption keys, maps, etc.)
    if (trimmed.startsWith('#')) {
      return line.replace(/(URI=)(["'])(.*?)\2/g, (match, prefix, quote, uri) => {
        try {
          // Resolve relative URL
          let absoluteUrl: string
          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            absoluteUrl = uri
          } else {
            // Use URL constructor to properly resolve relative paths
            absoluteUrl = new URL(uri, base).toString()
          }
          return `${prefix}${quote}/api/proxy?url=${encodeURIComponent(absoluteUrl)}${quote}`
        } catch (e) {
          console.error('Error rewriting URI in playlist:', e)
          return match
        }
      })
    }
    
    // Empty lines
    if (trimmed === '') {
      return line
    }
    
    // Comment lines (not URIs)
    if (trimmed.startsWith('#')) {
      return line
    }
    
    // Segment/sub-manifest lines (relative or absolute URLs)
    try {
      let absoluteUrl: string
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        absoluteUrl = trimmed
      } else {
        // Use URL constructor to properly resolve relative paths like "v0.m3u8" or "v0/0"
        absoluteUrl = new URL(trimmed, base).toString()
      }
      return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`
    } catch (e) {
      console.error('Error rewriting segment URL:', trimmed, e)
      return line
    }
  }).join('\n')
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}
