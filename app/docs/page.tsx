'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Copy, Film, Code2, Zap, Shield, Globe2 } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function DocsPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('introduction')

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Debounce scroll handler for better performance
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      scrollTimeout = setTimeout(() => {
        const sections = [
          'introduction',
          'quick-start',
          'authentication',
          'embed-endpoint',
          'parameters',
          'response',
          'errors',
          'html-example',
          'react-example',
          'vue-example',
          'rate-limits',
          'best-practices'
        ]

        // Get all section elements and their positions
        const sectionElements = sections.map(id => ({
          id,
          element: document.getElementById(id)
        })).filter(item => item.element !== null)

        // Find the section that's currently in view
        const scrollPosition = window.scrollY + 100 // Offset for header

        for (let i = sectionElements.length - 1; i >= 0; i--) {
          const section = sectionElements[i]
          if (section.element && section.element.offsetTop <= scrollPosition) {
            setActiveSection(section.id)
            break
          }
        }
      }, 50) // 50ms debounce
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [])

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard?.writeText(text)
    setCopiedEndpoint(id)
    const timer = setTimeout(() => setCopiedEndpoint(null), 2000)
    return () => clearTimeout(timer)
  }

  return (
    <main className="docs-page">
      <Header currentPage="docs" />

      <div className="docs-container">
        <aside className="docs-sidebar">
          <nav className="docs-nav">
            <span className="nav-section">Getting Started</span>
            <a href="#introduction" className={activeSection === 'introduction' ? 'nav-link active' : 'nav-link'}>Introduction</a>
            <a href="#quick-start" className={activeSection === 'quick-start' ? 'nav-link active' : 'nav-link'}>Quick Start</a>
            <a href="#authentication" className={activeSection === 'authentication' ? 'nav-link active' : 'nav-link'}>Authentication</a>
            
            <span className="nav-section">API Reference</span>
            <a href="#embed-endpoint" className={activeSection === 'embed-endpoint' ? 'nav-link active' : 'nav-link'}>Embed Endpoint</a>
            <a href="#parameters" className={activeSection === 'parameters' ? 'nav-link active' : 'nav-link'}>Parameters</a>
            <a href="#response" className={activeSection === 'response' ? 'nav-link active' : 'nav-link'}>Response Format</a>
            <a href="#errors" className={activeSection === 'errors' ? 'nav-link active' : 'nav-link'}>Error Handling</a>
            
            <span className="nav-section">Examples</span>
            <a href="#html-example" className={activeSection === 'html-example' ? 'nav-link active' : 'nav-link'}>HTML/JavaScript</a>
            <a href="#react-example" className={activeSection === 'react-example' ? 'nav-link active' : 'nav-link'}>React</a>
            <a href="#vue-example" className={activeSection === 'vue-example' ? 'nav-link active' : 'nav-link'}>Vue.js</a>
            
            <span className="nav-section">Resources</span>
            <a href="#rate-limits" className={activeSection === 'rate-limits' ? 'nav-link active' : 'nav-link'}>Rate Limits</a>
            <a href="#best-practices" className={activeSection === 'best-practices' ? 'nav-link active' : 'nav-link'}>Best Practices</a>
          </nav>
        </aside>

        <article className="docs-content">
          <section id="introduction" className="doc-section">
            <h1>API Documentation</h1>
            <p className="lead">A simple, powerful API for embedding anime video players with HLS streaming, subtitles, and metadata.</p>
            
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon"><Zap size={20} /></div>
                <h3>Lightning Fast</h3>
                <p>Optimized HLS delivery with CDN caching for instant playback</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Shield size={20} /></div>
                <h3>CORS Ready</h3>
                <p>Full CORS support for seamless cross-origin embedding</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Globe2 size={20} /></div>
                <h3>Multi-Source</h3>
                <p>Support for both AniList and MyAnimeList identifiers</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Code2 size={20} /></div>
                <h3>No SDK Required</h3>
                <p>Simple iframe embedding with zero dependencies</p>
              </div>
            </div>
          </section>

          <section id="quick-start" className="doc-section">
            <h2>Quick Start</h2>
            <p>Get started in less than 2 minutes with a single line of code.</p>
            
            <div className="code-block">
              <div className="code-header">
                <span>HTML</span>
                <button 
                  onClick={() => copyToClipboard('<iframe src="https://yourdomain.com/api/embed?anilistId=154587&episode=1" allow="fullscreen" allowfullscreen></iframe>', 'quickstart')}
                  className="copy-btn"
                >
                  {copiedEndpoint === 'quickstart' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <pre><code>&lt;iframe{'\n'}  src=&quot;https://yourdomain.com/api/embed?anilistId=154587&amp;episode=1&quot;{'\n'}  allow=&quot;fullscreen&quot;{'\n'}  allowfullscreen{'\n'}  style=&quot;width: 100%; height: 100vh; border: none;&quot;{'\n'}&gt;&lt;/iframe&gt;</code></pre>
            </div>
          </section>

          <section id="authentication" className="doc-section">
            <h2>Authentication</h2>
            <p>No authentication required. The API is open and free to use.</p>
            <div className="info-box">
              <strong>Note:</strong> While no API key is required, please be mindful of rate limits and use caching where appropriate.
            </div>
          </section>

          <section id="embed-endpoint" className="doc-section">
            <h2>Embed Endpoint</h2>
            <p>The main endpoint for embedding the video player.</p>
            
            <div className="endpoint-box">
              <span className="http-method">GET</span>
              <code className="endpoint-url">/api/embed</code>
            </div>

            <p>Returns an HTML page with an embedded JW Player configured for HLS streaming.</p>
          </section>

          <section id="parameters" className="doc-section">
            <h2>Parameters</h2>
            <p>All parameters are passed as query strings in the URL.</p>

            <div className="params-table">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>anilistId</code></td>
                    <td>integer</td>
                    <td>conditional*</td>
                    <td>AniList anime ID. Required if <code>malId</code> is not provided.</td>
                  </tr>
                  <tr>
                    <td><code>malId</code></td>
                    <td>integer</td>
                    <td>conditional*</td>
                    <td>MyAnimeList anime ID. Required if <code>anilistId</code> is not provided.</td>
                  </tr>
                  <tr>
                    <td><code>episode</code></td>
                    <td>integer</td>
                    <td>optional</td>
                    <td>Episode number. Defaults to <code>1</code>.</td>
                  </tr>
                  <tr>
                    <td><code>audio</code></td>
                    <td>string</td>
                    <td>optional</td>
                    <td>Audio preference: <code>sub</code> or <code>dub</code>. Defaults to <code>sub</code>.</td>
                  </tr>
                  <tr>
                    <td><code>autoplay</code></td>
                    <td>boolean</td>
                    <td>optional</td>
                    <td>Auto-start playback. Accepts <code>true</code> or <code>false</code>. Defaults to <code>false</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="note">* You must provide exactly one of <code>anilistId</code> or <code>malId</code>. Providing both or neither will result in an error.</p>

            <h3>Example Requests</h3>
            
            <div className="examples-list">
              <div className="example-item">
                <p><strong>Using AniList ID with sub audio:</strong></p>
                <div className="code-block">
                  <div className="code-header">
                    <span>Request</span>
                    <button 
                      onClick={() => copyToClipboard('GET /api/embed?anilistId=154587&episode=1&audio=sub', 'ex1')}
                      className="copy-btn"
                    >
                      {copiedEndpoint === 'ex1' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre><code>GET /api/embed?anilistId=154587&amp;episode=1&amp;audio=sub</code></pre>
                </div>
              </div>

              <div className="example-item">
                <p><strong>Using MAL ID with dub audio and autoplay:</strong></p>
                <div className="code-block">
                  <div className="code-header">
                    <span>Request</span>
                    <button 
                      onClick={() => copyToClipboard('GET /api/embed?malId=40028&episode=5&audio=dub&autoplay=true', 'ex2')}
                      className="copy-btn"
                    >
                      {copiedEndpoint === 'ex2' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre><code>GET /api/embed?malId=40028&amp;episode=5&amp;audio=dub&amp;autoplay=true</code></pre>
                </div>
              </div>
            </div>
          </section>

          <section id="response" className="doc-section">
            <h2>Response Format</h2>
            <p>The endpoint returns an HTML page with an embedded video player, not JSON.</p>

            <div className="info-box">
              <strong>Content-Type:</strong> <code>text/html</code>
            </div>

            <p>The response includes:</p>
            <ul>
              <li>JW Player with HLS streaming</li>
              <li>Multi-language subtitle tracks</li>
              <li>Anime title overlay</li>
              <li>Player controls and settings</li>
              <li>Fullscreen support</li>
            </ul>

            <h3>Features Included</h3>
            <div className="feature-list">
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Adaptive bitrate streaming (HLS)</span>
              </div>
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Multiple subtitle languages</span>
              </div>
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Intro/outro detection</span>
              </div>
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Episode and anime title display</span>
              </div>
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Mobile-responsive player</span>
              </div>
              <div className="feature-item">
                <Check size={16} className="check-icon" />
                <span>Picture-in-picture support</span>
              </div>
            </div>
          </section>

          <section id="errors" className="doc-section">
            <h2>Error Handling</h2>
            <p>The API returns user-friendly error pages with appropriate HTTP status codes.</p>

            <div className="error-table">
              <table>
                <thead>
                  <tr>
                    <th>Status Code</th>
                    <th>Error</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>400</code></td>
                    <td>Bad Request</td>
                    <td>Invalid parameters (missing ID, invalid episode number, etc.)</td>
                  </tr>
                  <tr>
                    <td><code>502</code></td>
                    <td>Bad Gateway</td>
                    <td>Upstream source unavailable or no valid HLS source found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="html-example" className="doc-section">
            <h2>HTML / JavaScript Example</h2>
            <p>Basic HTML page with embedded player.</p>

            <div className="code-block">
              <div className="code-header">
                <span>index.html</span>
                <button 
                  onClick={() => copyToClipboard(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anime Player</title>
  <style>
    body { margin: 0; background: #000; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://yourdomain.com/api/embed?anilistId=154587&episode=1&audio=sub"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`, 'html-ex')}
                  className="copy-btn"
                >
                  {copiedEndpoint === 'html-ex' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <pre><code>{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anime Player</title>
  <style>
    body { margin: 0; background: #000; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://yourdomain.com/api/embed?anilistId=154587&episode=1&audio=sub"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`}</code></pre>
            </div>
          </section>

          <section id="react-example" className="doc-section">
            <h2>React Example</h2>
            <p>React component with TypeScript.</p>

            <div className="code-block">
              <div className="code-header">
                <span>AnimePlayer.tsx</span>
                <button 
                  onClick={() => copyToClipboard(`import { useState } from 'react'

export default function AnimePlayer() {
  const [episode, setEpisode] = useState(1)
  const [audio, setAudio] = useState<'sub' | 'dub'>('sub')

  const embedUrl = \`https://yourdomain.com/api/embed?anilistId=154587&episode=\${episode}&audio=\${audio}\`

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '1rem', background: '#111' }}>
        <button onClick={() => setEpisode(episode - 1)} disabled={episode <= 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem', color: '#fff' }}>Episode {episode}</span>
        <button onClick={() => setEpisode(episode + 1)}>Next</button>
        
        <button onClick={() => setAudio(audio === 'sub' ? 'dub' : 'sub')} style={{ marginLeft: '2rem' }}>
          {audio === 'sub' ? 'Switch to Dub' : 'Switch to Sub'}
        </button>
      </div>
      
      <iframe
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: 'calc(100vh - 60px)', border: 'none' }}
      />
    </div>
  )
}`, 'react-ex')}
                  className="copy-btn"
                >
                  {copiedEndpoint === 'react-ex' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <pre><code>{`import { useState } from 'react'

export default function AnimePlayer() {
  const [episode, setEpisode] = useState(1)
  const [audio, setAudio] = useState<'sub' | 'dub'>('sub')

  const embedUrl = \`https://yourdomain.com/api/embed?anilistId=154587&episode=\${episode}&audio=\${audio}\`

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '1rem', background: '#111' }}>
        <button onClick={() => setEpisode(episode - 1)} disabled={episode <= 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem', color: '#fff' }}>Episode {episode}</span>
        <button onClick={() => setEpisode(episode + 1)}>Next</button>
        
        <button onClick={() => setAudio(audio === 'sub' ? 'dub' : 'sub')} style={{ marginLeft: '2rem' }}>
          {audio === 'sub' ? 'Switch to Dub' : 'Switch to Sub'}
        </button>
      </div>
      
      <iframe
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: 'calc(100vh - 60px)', border: 'none' }}
      />
    </div>
  )
}`}</code></pre>
            </div>
          </section>

          <section id="vue-example" className="doc-section">
            <h2>Vue.js Example</h2>
            <p>Vue 3 component with Composition API.</p>

            <div className="code-block">
              <div className="code-header">
                <span>AnimePlayer.vue</span>
                <button 
                  onClick={() => copyToClipboard(`<template>
  <div class="player-container">
    <div class="controls">
      <button @click="prevEpisode" :disabled="episode <= 1">Previous</button>
      <span>Episode {{ episode }}</span>
      <button @click="nextEpisode">Next</button>
      <button @click="toggleAudio" class="audio-toggle">
        {{ audio === 'sub' ? 'Switch to Dub' : 'Switch to Sub' }}
      </button>
    </div>
    
    <iframe
      :src="embedUrl"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      class="player-iframe"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const episode = ref(1)
const audio = ref('sub')

const embedUrl = computed(() => 
  \`https://yourdomain.com/api/embed?anilistId=154587&episode=\${episode.value}&audio=\${audio.value}\`
)

const prevEpisode = () => episode.value--
const nextEpisode = () => episode.value++
const toggleAudio = () => audio.value = audio.value === 'sub' ? 'dub' : 'sub'
</script>

<style scoped>
.player-container { width: 100%; height: 100vh; }
.controls { padding: 1rem; background: #111; color: #fff; }
.player-iframe { width: 100%; height: calc(100vh - 60px); border: none; }
</style>`, 'vue-ex')}
                  className="copy-btn"
                >
                  {copiedEndpoint === 'vue-ex' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <pre><code>{`<template>
  <div class="player-container">
    <div class="controls">
      <button @click="prevEpisode" :disabled="episode <= 1">Previous</button>
      <span>Episode {{ episode }}</span>
      <button @click="nextEpisode">Next</button>
      <button @click="toggleAudio" class="audio-toggle">
        {{ audio === 'sub' ? 'Switch to Dub' : 'Switch to Sub' }}
      </button>
    </div>
    
    <iframe
      :src="embedUrl"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      class="player-iframe"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const episode = ref(1)
const audio = ref('sub')

const embedUrl = computed(() => 
  \`https://yourdomain.com/api/embed?anilistId=154587&episode=\${episode.value}&audio=\${audio.value}\`
)

const prevEpisode = () => episode.value--
const nextEpisode = () => episode.value++
const toggleAudio = () => audio.value = audio.value === 'sub' ? 'dub' : 'sub'
</script>

<style scoped>
.player-container { width: 100%; height: 100vh; }
.controls { padding: 1rem; background: #111; color: #fff; }
.player-iframe { width: 100%; height: calc(100vh - 60px); border: none; }
</style>`}</code></pre>
            </div>
          </section>

          <section id="rate-limits" className="doc-section">
            <h2>Rate Limits</h2>
            <p>Currently, there are no strict rate limits, but please use the API responsibly.</p>

            <div className="info-box">
              <strong>Recommendations:</strong>
              <ul>
                <li>Implement client-side caching for repeated requests</li>
                <li>Use CDN caching headers provided by the API</li>
                <li>Avoid making excessive requests in rapid succession</li>
              </ul>
            </div>
          </section>

          <section id="best-practices" className="doc-section">
            <h2>Best Practices</h2>

            <h3>1. Responsive Embedding</h3>
            <p>Always set the iframe to be responsive for mobile devices:</p>
            <div className="code-block">
              <pre><code>{`<iframe
  src="..."
  style="width: 100%; aspect-ratio: 16/9; border: none;"
/>`}</code></pre>
            </div>

            <h3>2. Permissions</h3>
            <p>Include necessary permissions in the <code>allow</code> attribute:</p>
            <div className="code-block">
              <pre><code>{`allow="autoplay; fullscreen; picture-in-picture"`}</code></pre>
            </div>

            <h3>3. Loading States</h3>
            <p>Add loading indicators while the iframe loads:</p>
            <div className="code-block">
              <pre><code>{`<div style="position: relative;">
  <div class="loading-spinner">Loading...</div>
  <iframe onload="hideSpinner()" ... />
</div>`}</code></pre>
            </div>

            <h3>4. Error Handling</h3>
            <p>Monitor iframe load errors and provide fallback UI:</p>
            <div className="code-block">
              <pre><code>{`<iframe
  onerror="handleError()"
  src="..."
/>`}</code></pre>
            </div>
          </section>

          <footer className="docs-footer">
            <p>Need help? <a href="/">Back to playground</a> or check our <a href="#introduction">introduction</a>.</p>
          </footer>
        </article>
      </div>
    </main>
  )
}
