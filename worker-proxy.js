// Cloudflare Worker – M3U8 + Subtitle Proxy
// CORS, Referer forwarding, subtitle debugging, and segment rewriting

/**
 * Convert SubRip (.srt) to WebVTT so browsers can render it natively
 */
function srtToVtt(srt) {
  return (
    'WEBVTT\n\n' +
    srt
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
      .trim()
  );
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Range, X-Referer',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ── Validate target URL ─────────────────────────────────────────────────
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" query parameter', {
        status: 400,
      });
    }

    // Validate URL
    let parsedTarget;

    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid target URL',
          url: targetUrl,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Referer:
    // ?referer= takes precedence, then X-Referer header
    const referer =
      url.searchParams.get('referer') ||
      request.headers.get('X-Referer') ||
      '';

    // ── Detect subtitle requests ────────────────────────────────────────────
    const targetLower = targetUrl.toLowerCase();

    const isSubtitle =
      targetLower.includes('opensubtitles.org') ||
      targetLower.includes('opensubtitles.com') ||
      targetLower.endsWith('.srt') ||
      targetLower.endsWith('.vtt') ||
      (
        targetLower.includes('/download/') &&
        (
          targetLower.includes('subencoding') ||
          targetLower.includes('src-api')
        )
      );

    // ── Build upstream headers ───────────────────────────────────────────────
    const upstreamHeaders = new Headers();

    upstreamHeaders.set(
      'User-Agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    upstreamHeaders.set(
      'Accept-Language',
      'en-US,en;q=0.9'
    );

    if (isSubtitle) {
      /*
       * Subtitle request
       *
       * IMPORTANT:
       * Do not assume that Referer/Origin authenticate OpenSubtitles.
       * We are adding them for compatibility, but if OpenSubtitles
       * returns 401, the diagnostic response below will show us
       * exactly what happened.
       */

      upstreamHeaders.set(
        'Accept',
        'text/plain,text/vtt,text/html,application/xhtml+xml,*/*;q=0.8'
      );

      upstreamHeaders.set(
        'Accept-Encoding',
        'identity'
      );

      // Use the actual OpenSubtitles domain being requested.
      const subtitleOrigin =
        `${parsedTarget.protocol}//${parsedTarget.hostname}`;

      upstreamHeaders.set(
        'Referer',
        `${subtitleOrigin}/`
      );

      upstreamHeaders.set(
        'Origin',
        subtitleOrigin
      );
    } else {
      upstreamHeaders.set(
        'Accept',
        request.headers.get('Accept') || '*/*'
      );

      if (referer) {
        upstreamHeaders.set('Referer', referer);

        try {
          upstreamHeaders.set(
            'Origin',
            new URL(referer).origin
          );
        } catch {
          // Ignore invalid referer
        }
      }

      // Forward Range header so MP4 seeking works
      const range = request.headers.get('Range');

      if (range) {
        upstreamHeaders.set('Range', range);
      }
    }

    // ── Fetch upstream ──────────────────────────────────────────────────────
    let response;

    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: upstreamHeaders,
        redirect: 'follow',
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'Proxy fetch error',
          message: err?.message || String(err),
          targetUrl,
        }, null, 2),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ── Debug upstream errors ───────────────────────────────────────────────
    if (!response.ok && response.status !== 206) {

      /*
       * For subtitles, expose useful diagnostic information.
       *
       * This lets us determine whether:
       *
       * OpenSubtitles → 401
       *
       * OR
       *
       * OpenSubtitles → redirect → CDN → 401
       *
       * without exposing request credentials.
       */
      if (isSubtitle) {
        let body = '';

        try {
          body = await response.text();
        } catch {
          body = '[Unable to read upstream response body]';
        }

        const diagnostics = {
          error: 'OpenSubtitles upstream request failed',

          upstreamStatus: response.status,
          upstreamStatusText: response.statusText,

          requestedUrl: targetUrl,

          finalUrl: response.url,

          contentType:
            response.headers.get('content-type'),

          location:
            response.headers.get('location'),

          server:
            response.headers.get('server'),

          wwwAuthenticate:
            response.headers.get('www-authenticate'),

          bodyPreview:
            body.substring(0, 1500),
        };

        return new Response(
          JSON.stringify(diagnostics, null, 2),
          {
            status: response.status,

            headers: {
              'Content-Type':
                'application/json; charset=utf-8',

              'Access-Control-Allow-Origin': '*',

              'Access-Control-Allow-Methods':
                'GET, OPTIONS',

              'Cache-Control':
                'no-store',
            },
          }
        );
      }

      // Normal non-subtitle error
      return new Response(
        JSON.stringify({
          error:
            `Upstream error: ${response.status} ${response.statusText}`,
        }),
        {
          status: response.status,

          headers: {
            'Content-Type':
              'application/json',

            'Access-Control-Allow-Origin':
              '*',

            'Access-Control-Allow-Methods':
              'GET, OPTIONS',
          },
        }
      );
    }

    // ── Subtitle response: normalize to VTT ─────────────────────────────────
    if (isSubtitle) {
      const text = await response.text();

      const trimmed = text.trim();

      /*
       * If OpenSubtitles returns an HTML page instead of a subtitle,
       * don't convert that HTML into broken VTT.
       */
      const lowerText = trimmed.toLowerCase();

      if (
        lowerText.startsWith('<!doctype html') ||
        lowerText.startsWith('<html') ||
        lowerText.includes('<html')
      ) {
        return new Response(
          JSON.stringify({
            error:
              'OpenSubtitles returned HTML instead of subtitle data',

            upstreamStatus:
              response.status,

            finalUrl:
              response.url,

            contentType:
              response.headers.get('content-type'),

            bodyPreview:
              trimmed.substring(0, 1500),
          }, null, 2),
          {
            status: 502,

            headers: {
              'Content-Type':
                'application/json; charset=utf-8',

              'Access-Control-Allow-Origin':
                '*',

              'Cache-Control':
                'no-store',
            },
          }
        );
      }

      const vtt =
        trimmed.startsWith('WEBVTT')
          ? trimmed
          : srtToVtt(trimmed);

      return new Response(vtt, {
        status: 200,

        headers: {
          'Content-Type':
            'text/vtt; charset=utf-8',

          'Cache-Control':
            'public, max-age=86400, immutable',

          'Access-Control-Allow-Origin':
            '*',

          'Access-Control-Allow-Methods':
            'GET, OPTIONS',

          'Access-Control-Expose-Headers':
            'Content-Length, Content-Type',
        },
      });
    }

    // ── Cloudflare/origin block detection ───────────────────────────────────
    const cfBlockPatterns = [
      'you have been blocked',
      'access denied',
      'error code: 1020',
      'error code: 1015',
    ];

    const responseContentType =
      response.headers.get('content-type') || '';

    // ── HTML content-type ────────────────────────────────────────────────────
    if (responseContentType.includes('text/html')) {
      const buffer =
        await response.arrayBuffer();

      const prefix =
        new TextDecoder()
          .decode(buffer.slice(0, 512))
          .toLowerCase();

      if (
        cfBlockPatterns.some(
          (p) => prefix.includes(p)
        )
      ) {
        return new Response(
          JSON.stringify({
            error:
              'Origin blocked proxy IP',
          }),
          {
            status: 403,

            headers: {
              'Content-Type':
                'application/json',

              'Access-Control-Allow-Origin':
                '*',
            },
          }
        );
      }

      if (
        prefix.includes('<html') ||
        prefix.includes('<!doctype')
      ) {
        response = new Response(
          buffer,
          {
            status: response.status,
            headers: response.headers,
          }
        );
      } else {
        const segHeaders =
          new Headers();

        segHeaders.set(
          'Content-Type',
          'video/mp2t'
        );

        segHeaders.set(
          'Access-Control-Allow-Origin',
          '*'
        );

        segHeaders.set(
          'Access-Control-Allow-Methods',
          'GET, OPTIONS'
        );

        segHeaders.set(
          'Access-Control-Expose-Headers',
          'Content-Length, Content-Range'
        );

        segHeaders.set(
          'Cache-Control',
          'no-store'
        );

        return new Response(
          buffer,
          {
            status: response.status,
            headers: segHeaders,
          }
        );
      }
    }

    // ── Decide: playlist rewrite vs passthrough ──────────────────────────────
    const contentType =
      response.headers.get('content-type') || '';

    const isPlaylist =
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      targetUrl.includes('.m3u8') ||
      targetUrl.includes('.m3u') ||
      /\/pl\/[A-Za-z0-9_.~-]+\/master\.m3u8/.test(
        targetUrl
      ) ||
      targetUrl.endsWith('master.m3u8') ||
      targetUrl.endsWith('index.m3u8');

    // ── Rewrite playlist ────────────────────────────────────────────────────
    if (isPlaylist) {
      const text =
        await response.text();

      const rewritten =
        rewritePlaylist(
          text,
          targetUrl,
          request.url,
          referer
        );

      const newHeaders =
        new Headers();

      newHeaders.set(
        'Content-Type',
        'application/vnd.apple.mpegurl'
      );

      newHeaders.set(
        'Access-Control-Allow-Origin',
        '*'
      );

      newHeaders.set(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS'
      );

      newHeaders.set(
        'Cache-Control',
        'no-store'
      );

      return new Response(
        rewritten,
        {
          status: response.status,
          headers: newHeaders,
        }
      );
    }

    // ── Passthrough: segments, MP4, keys, etc. ───────────────────────────────
    const newHeaders =
      new Headers(response.headers);

    newHeaders.set(
      'Access-Control-Allow-Origin',
      '*'
    );

    newHeaders.set(
      'Access-Control-Allow-Methods',
      'GET, OPTIONS'
    );

    newHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Range'
    );

    newHeaders.delete(
      'Content-Security-Policy'
    );

    newHeaders.delete(
      'X-Frame-Options'
    );

    return new Response(
      response.body,
      {
        status: response.status,
        headers: newHeaders,
      }
    );
  },
};


/**
 * Rewrite all URLs in an M3U8 playlist so every subsequent request
 * (sub-manifests, segments, encryption keys, maps) also goes through
 * this proxy.
 */
function rewritePlaylist(
  text,
  baseUrl,
  proxyRequestUrl,
  referer
) {
  // Strip query string to get clean proxy endpoint
  const proxyEndpoint = (() => {
    const u =
      new URL(proxyRequestUrl);

    u.search = '';

    return u.toString();
  })();

  const proxyBase =
    new URL(proxyEndpoint);

  /**
   * Build proxied URL for any resolved upstream URL.
   */
  function toProxied(resolvedUrl) {
    const params =
      new URLSearchParams({
        url: resolvedUrl,
      });

    if (referer) {
      params.set(
        'referer',
        referer
      );
    }

    return `${proxyEndpoint}?${params.toString()}`;
  }

  /**
   * Resolve a potentially relative URI
   * against manifest base.
   */
  function resolve(uri) {
    return new URL(
      uri,
      baseUrl
    ).toString();
  }

  /**
   * True if URL already points back
   * at this proxy.
   */
  function alreadyProxied(resolved) {
    try {
      const u =
        new URL(resolved);

      return (
        u.hostname ===
          proxyBase.hostname &&
        u.searchParams.has('url')
      );
    } catch {
      return false;
    }
  }

  return text
    .split('\n')
    .map((line) => {
      const trimmed =
        line.trim();

      // ── Tag lines (#EXT…) ────────────────────────────────────────────────
      if (
        trimmed.startsWith('#')
      ) {
        return line.replace(
          /(URI=)(["'])(.*?)\2/g,
          (
            match,
            prefix,
            quote,
            uri
          ) => {
            try {
              const resolved =
                resolve(uri);

              if (
                alreadyProxied(
                  resolved
                )
              ) {
                return match;
              }

              return (
                `${prefix}${quote}` +
                `${toProxied(resolved)}` +
                `${quote}`
              );
            } catch {
              return match;
            }
          }
        );
      }

      // ── Empty lines ─────────────────────────────────────────────────────
      if (trimmed === '') {
        return line;
      }

      // ── Segment / sub-manifest lines ────────────────────────────────────
      try {
        const resolved =
          resolve(trimmed);

        if (
          alreadyProxied(
            resolved
          )
        ) {
          return line;
        }

        return toProxied(
          resolved
        );
      } catch {
        return line;
      }
    })
    .join('\n');
}