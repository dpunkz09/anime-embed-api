import { NextRequest, NextResponse } from 'next/server'

const SOURCE_ORIGIN = process.env.SOURCE_ORIGIN || ''
const REFERER = process.env.SOURCE_REFERER || ''
const JW_PLAYER_KEY = process.env.JW_PLAYER_KEY || ''

if (!JW_PLAYER_KEY) {
  console.warn('Warning: JW_PLAYER_KEY is not set in environment variables')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const anilistId = searchParams.get('anilistId')
  const malId = searchParams.get('malId')
  const episode = searchParams.get('episode') || '1'
  const audioPreference = searchParams.get('audio') || 'sub' // 'sub' or 'dub'
  const autoplay = searchParams.get('autoplay') === 'true' // defaults to false

  if ((!anilistId && !malId) || (anilistId && malId)) {
    return new NextResponse(renderError('Provide exactly one of anilistId or malId.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }
  if (!/^\d+$/.test(episode) || (anilistId && !/^\d+$/.test(anilistId)) || (malId && !/^\d+$/.test(malId))) {
    return new NextResponse(renderError('IDs and episode must be numeric.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }
  if (audioPreference !== 'sub' && audioPreference !== 'dub') {
    return new NextResponse(renderError('Audio parameter must be either "sub" or "dub".'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }

  const provider = anilistId ? 'ani' : 'mal'
  const id = anilistId || malId

  // Fetch anime title
  let animeTitle = 'Episode'
  try {
    if (anilistId) {
      animeTitle = await fetchAniListTitle(anilistId)
    } else if (malId) {
      animeTitle = await fetchMALTitle(malId)
    }
  } catch (error) {
    // Silently fail and use default title
    console.error('Failed to fetch anime title:', error)
  }

  const upstream = `${SOURCE_ORIGIN}/${provider}/${id}/${episode}`

  try {
    const response = await fetch(upstream, {
      headers: { Referer: REFERER, Origin: 'https://yenime.net', Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!response.ok) {
      return new NextResponse(renderError('Upstream source unavailable.'), {
        status: 502,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    const payload = await response.json()
    
    // Extract HLS sources from the payload
    const sources = payload.sources || []
    
    if (!sources.length) {
      return new NextResponse(renderError('No sources found in response.'), {
        status: 502,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    // Find source based on audio preference
    let hlsSource = sources.find((s: any) => s.audio === audioPreference)
    
    // Fallback: if preferred audio not found, use the first available
    if (!hlsSource) {
      hlsSource = sources[0]
    }
    
    if (!hlsSource || !hlsSource.url) {
      return new NextResponse(renderError('No valid HLS source found.'), {
        status: 502,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const html = renderPlayer(hlsSource, payload, sources, autoplay, animeTitle, episode)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch {
    return new NextResponse(renderError('Unable to resolve media sources.'), {
      status: 502,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function fetchAniListTitle(anilistId: string): Promise<string> {
  try {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          title {
            english
            romaji
            native
          }
        }
      }
    `

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: parseInt(anilistId) }
      }),
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache for 24 hours
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('AniList API request failed')
    }

    const data = await response.json()
    const title = data.data?.Media?.title
    
    // Prefer English, fall back to Romaji, then Native
    return title?.english || title?.romaji || title?.native || 'Episode'
  } catch (error) {
    console.error('AniList API error:', error)
    // Return generic title on error
    return 'Episode'
  }
}

async function fetchMALTitle(malId: string): Promise<string> {
  try {
    // MyAnimeList API requires authentication, so we'll use Jikan (unofficial MAL API)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, {
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache for 24 hours
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Jikan API request failed')
    }

    const data = await response.json()
    return data.data?.title || data.data?.title_english || 'Episode'
  } catch (error) {
    console.error('Jikan API error:', error)
    // Return generic title on error
    return 'Episode'
  }
}

function renderPlayer(source: any, payload: any, allSources: any[], autoplay: boolean, animeTitle: string, episodeNumber: string) {
  const title = `${animeTitle} - Episode ${episodeNumber}`
  const tracks = source.tracks || []
  const intro = payload.intro || null
  const outro = payload.outro || null
  const poster = payload.image || ''
  
  // Use local proxy endpoint (proven to work)
  const proxiedHlsUrl = `/api/proxy?url=${encodeURIComponent(source.url)}`
  const proxiedPoster = poster ? `/api/proxy?url=${encodeURIComponent(poster)}` : ''
  
  // Convert tracks to JW Player format with proxied URLs
  const jwTracks = tracks.map((track: any) => ({
    file: `/api/proxy?url=${encodeURIComponent(track.file)}`,
    label: track.label,
    kind: 'captions',
    default: track.default || false
  }))
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://ssl.p.jwpcdn.com/player/v/8.22.0/jwplayer.js"></script>
  <script>jwplayer.key="${JW_PLAYER_KEY}";</script>
  <script>
    // Disable devtools protection (only in production)
    (function() {
      // Check if we're in production (you can detect this via domain or other means)
      const isProduction = window.location.hostname !== 'localhost' && 
                          !window.location.hostname.startsWith('192.168') &&
                          !window.location.hostname.startsWith('127.0.0.1');
      
      if (!isProduction) {
        console.log('DevTools protection disabled in development');
        return;
      }

      const isDevToolsOpen = () => {
        const threshold = 160;
        return window.outerWidth - window.innerWidth > threshold || 
               window.outerHeight - window.innerHeight > threshold;
      };

      // Disable right-click
      document.addEventListener('contextmenu', (e) => e.preventDefault());

      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          return false;
        }
      });

      // Disable text selection
      document.addEventListener('selectstart', (e) => e.preventDefault());

      // Clear console regularly
      setInterval(() => {
        if (isDevToolsOpen()) {
          window.location.reload();
        }
        console.clear();
      }, 1000);

      // Prevent debugger
      setInterval(() => {
        (function() { return false; })['constructor']('debugger')();
      }, 500);
    })();
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    body {
      background: #000;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #player {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    #title-overlay {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 999;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: calc(100% - 40px);
    }
    #title-overlay.visible {
      opacity: 1;
    }
    @media (max-width: 768px) {
      #title-overlay {
        font-size: 14px;
        top: 12px;
        left: 12px;
        max-width: calc(100% - 24px);
      }
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <div id="title-overlay">${escapeHtml(title)}</div>
  <script>
    const player = jwplayer("player");
    const titleOverlay = document.getElementById('title-overlay');
    
    player.setup({
      file: ${JSON.stringify(proxiedHlsUrl)},
      type: "hls",
      title: ${JSON.stringify(title)},
      image: ${JSON.stringify(proxiedPoster)},
      width: "100%",
      height: "100%",
      aspectratio: "16:9",
      stretching: "uniform",
      autostart: ${autoplay},
      preload: "auto",
      primary: "html5",
      controls: true,
      displaytitle: false,
      displaydescription: false,
      tracks: ${JSON.stringify(jwTracks)},
      captions: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#000000',
        backgroundOpacity: 75,
        edgeStyle: 'uniform'
      },
      skin: {
        name: "seven"
      }
    });

    // Show title overlay when controls are visible
    player.on('controlbarVisibilityChanged', function(e) {
      if (e.visible) {
        titleOverlay.classList.add('visible');
      } else {
        titleOverlay.classList.remove('visible');
      }
    });

    // Show title on ready and when user interacts
    player.on('ready', function() {
      titleOverlay.classList.add('visible');
      setTimeout(function() {
        if (player.getState() !== 'playing') {
          titleOverlay.classList.remove('visible');
        }
      }, 3000);
    });

    player.on('play', function() {
      titleOverlay.classList.add('visible');
      setTimeout(function() {
        titleOverlay.classList.remove('visible');
      }, 3000);
    });

    player.on('pause', function() {
      titleOverlay.classList.add('visible');
    });

    player.on('displayClick', function() {
      titleOverlay.classList.add('visible');
      setTimeout(function() {
        if (player.getState() === 'playing') {
          titleOverlay.classList.remove('visible');
        }
      }, 3000);
    });
    
    ${intro ? `
    // Skip intro functionality
    let introSkipped = false;
    player.on('time', function(e) {
      const currentTime = e.position;
      const introStart = ${intro.start};
      const introEnd = ${intro.end};
      
      if (currentTime >= introStart && currentTime < introEnd && !introSkipped) {
        // Show skip intro button (using JW Player's custom button API would be ideal)
        // For now, we'll auto-detect but not auto-skip
      }
      
      if (currentTime >= introEnd) {
        introSkipped = false; // Reset for replay
      }
    });
    ` : ''}
    
    ${outro ? `
    // Auto-advance or notify near outro
    player.on('time', function(e) {
      const currentTime = e.position;
      const outroStart = ${outro.start};
      
      if (currentTime >= outroStart) {
        // Near the end, could trigger next episode
      }
    });
    ` : ''}
  </script>
</body>
</html>`
}

function renderError(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .error {
      text-align: center;
      max-width: 500px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #ef4444;
    }
    p {
      font-size: 16px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Error</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
