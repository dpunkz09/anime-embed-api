'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, CircleHelp, Code2, Copy, ExternalLink, Film, GitBranch, Globe2, Layers3, Menu, Play, Search, Server, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react'
import Image from 'next/image'
import Header from '@/components/Header'

const sampleSources = [
  { quality: '1080p', audio: 'Japanese', type: 'SUB', active: true },
  { quality: '1080p', audio: 'English', type: 'DUB', active: false },
  { quality: '720p', audio: 'Japanese', type: 'SUB', active: false },
]

const sampleTracks = ['English', 'Arabic', 'French', 'German', 'Italian', 'Portuguese (Brazil)', 'Spanish']

export default function Page() {
  const [idType, setIdType] = useState<'anilistId' | 'malId'>('anilistId')
  const [id, setId] = useState('154587')
  const [episode, setEpisode] = useState('1')
  const [audio, setAudio] = useState<'sub' | 'dub'>('sub')
  const [autoplay, setAutoplay] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'iframe'>('html')

  const endpoint = useMemo(() => `/api/embed?${idType}=${id || '154587'}&episode=${episode || '1'}&audio=${audio}&autoplay=${autoplay}`, [idType, id, episode, audio, autoplay])
  
  const fullEndpoint = useMemo(() => {
    if (mounted) {
      return `${window.location.origin}${endpoint}`
    }
    return endpoint
  }, [endpoint, mounted])

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    let copiedTimer: NodeJS.Timeout | null = null
    let codeCopiedTimer: NodeJS.Timeout | null = null

    return () => {
      if (copiedTimer) clearTimeout(copiedTimer)
      if (codeCopiedTimer) clearTimeout(codeCopiedTimer)
    }
  }, [])

  function copyEndpoint() {
    navigator.clipboard?.writeText(fullEndpoint)
    setCopied(true)
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }

  function handleIdChange(value: string) {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setId(value)
    }
  }

  function handleEpisodeChange(value: string) {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setEpisode(value)
    }
  }

  function copyCode() {
    let code = ''
    if (activeTab === 'html') {
      code = getHtmlCode()
    } else if (activeTab === 'react') {
      code = getReactCode()
    } else if (activeTab === 'iframe') {
      code = getIframeCode()
    }
    
    navigator.clipboard?.writeText(code)
    setCodeCopied(true)
    const timer = setTimeout(() => setCodeCopied(false), 1800)
    return () => clearTimeout(timer)
  }

  function getHtmlCode() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anime Player</title>
  <style>
    body { margin: 0; }
    iframe { 
      width: 100vw; 
      height: 100vh; 
      border: none; 
    }
  </style>
</head>
<body>
  <iframe
    src="${fullEndpoint}"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
  ></iframe>
</body>
</html>`
  }

  function getReactCode() {
    return `export default function AnimePlayer() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="${fullEndpoint}"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  )
}`
  }

  function getIframeCode() {
    return `<iframe
  src="${fullEndpoint}"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
  style="width: 100%; height: 100vh; border: none;"
></iframe>`
  }

  return (
    <main className="app-shell">
      <Header currentPage="home" />

      <section className="hero" id="top">
        <div className="eyebrow"><span className="pulse" /> OPEN MEDIA EMBED API</div>
        <h1>Ship the player.<br /><em>Skip the plumbing.</em></h1>
        <p className="hero-copy">One endpoint for anime playback. Turn AniList or MyAnimeList IDs into<br className="desktop" /> a fully-featured embed player — ready to integrate anywhere.</p>
      </section>

      <section className="playground-wrap" id="playground">
        <div className="section-label"><span>01</span> TRY IT LIVE</div>
        <div className="playground-grid">
          <div className="panel request-panel">
            <div className="panel-heading"><div><h2>Build your request</h2><p>Pick an ID source and episode to test.</p></div><Terminal size={19} className="muted-icon" /></div>
            <div className="form-stack">
              <label>IDENTIFIER TYPE</label>
              <div className="segmented"><button className={idType === 'anilistId' ? 'selected' : ''} onClick={() => setIdType('anilistId')}><Globe2 size={15} /> AniList ID</button><button className={idType === 'malId' ? 'selected' : ''} onClick={() => setIdType('malId')}><Layers3 size={15} /> MAL ID</button></div>
              <div className="input-grid"><div><label htmlFor="id">{idType === 'anilistId' ? 'ANILIST ID' : 'MAL ID'}</label><input id="id" value={id} onChange={e => handleIdChange(e.target.value)} inputMode="numeric" pattern="[0-9]*" /></div><div><label htmlFor="episode">EPISODE</label><input id="episode" value={episode} onChange={e => handleEpisodeChange(e.target.value)} inputMode="numeric" pattern="[0-9]*" /></div></div>
              <label>AUDIO TYPE</label>
              <div className="segmented"><button className={audio === 'sub' ? 'selected' : ''} onClick={() => setAudio('sub')}>SUB</button><button className={audio === 'dub' ? 'selected' : ''} onClick={() => setAudio('dub')}>DUB</button></div>
              <label className="checkbox-label"><input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} /><span>Autoplay on load</span></label>
              <div className="url-preview"><span className="method">GET</span><code>{endpoint}</code><button onClick={copyEndpoint} aria-label="Copy endpoint">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
            </div>
          </div>

          <div className="panel response-panel" id="response">
            <div className="panel-heading response-heading"><div><h2>Live embed player</h2><p>Fully functional player with your selected content.</p></div><span className="live-badge"><span /> LIVE</span></div>
            <div className="embed-container">
              <iframe
                src={endpoint}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
              />
            </div>
            <div className="response-footer"><span><Play size={14} /> <b>Endpoint:</b> {endpoint}</span><button onClick={copyEndpoint} className="copy-endpoint-btn">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
          </div>
        </div>
      </section>

      <section className="docs-section" id="docs"><div className="section-label"><span>02</span> QUICK START</div><div className="docs-card"><div><h2>Built for the<br /><em>modern stack.</em></h2><p>Drop a player into any project with a single URL. No SDK, no auth, no setup.</p><a href="#playground" className="outline-btn">View playground <ExternalLink size={14} /></a></div><div className="install-block"><div className="install-tabs"><span className={activeTab === 'html' ? 'tab-active' : ''} onClick={() => setActiveTab('html')}>HTML</span><span className={activeTab === 'react' ? 'tab-active' : ''} onClick={() => setActiveTab('react')}>React</span><span className={activeTab === 'iframe' ? 'tab-active' : ''} onClick={() => setActiveTab('iframe')}>iframe</span></div><div className="code-container"><pre>{activeTab === 'html' && <><span className="syntax-tag">&lt;!DOCTYPE html&gt;</span>{'\n'}<span className="syntax-tag">&lt;html</span> <span className="syntax-key">lang</span>=<span className="syntax-string">&quot;en&quot;</span><span className="syntax-tag">&gt;</span>{'\n'}<span className="syntax-tag">&lt;head&gt;</span>{'\n'}  <span className="syntax-tag">&lt;meta</span> <span className="syntax-key">charset</span>=<span className="syntax-string">&quot;UTF-8&quot;</span><span className="syntax-tag">&gt;</span>{'\n'}  <span className="syntax-tag">&lt;style&gt;</span>{'\n'}    body <span className="syntax-brace">{'{'}</span> margin: 0; <span className="syntax-brace">{'}'}</span>{'\n'}    iframe <span className="syntax-brace">{'{'}</span> width: 100vw; height: 100vh; border: none; <span className="syntax-brace">{'}'}</span>{'\n'}  <span className="syntax-tag">&lt;/style&gt;</span>{'\n'}<span className="syntax-tag">&lt;/head&gt;</span>{'\n'}<span className="syntax-tag">&lt;body&gt;</span>{'\n'}  <span className="syntax-tag">&lt;iframe</span>{'\n'}    <span className="syntax-key">src</span>=<span className="syntax-string">&quot;{fullEndpoint}&quot;</span>{'\n'}    <span className="syntax-key">allow</span>=<span className="syntax-string">&quot;fullscreen&quot;</span>{'\n'}    <span className="syntax-key">allowfullscreen</span>{'\n'}  <span className="syntax-tag">/&gt;</span>{'\n'}<span className="syntax-tag">&lt;/body&gt;</span>{'\n'}<span className="syntax-tag">&lt;/html&gt;</span></>}{activeTab === 'react' && <><span className="syntax-key">export default function</span> <span className="syntax-tag">AnimePlayer</span>() <span className="syntax-brace">{'{'}</span>{'\n'}  <span className="syntax-key">return</span> ({'\n'}    <span className="syntax-tag">&lt;div</span> <span className="syntax-key">style</span>=<span className="syntax-brace">{'{{'}</span> width: <span className="syntax-string">'100%'</span>, height: <span className="syntax-string">'100vh'</span> <span className="syntax-brace">{'}}'}</span><span className="syntax-tag">&gt;</span>{'\n'}      <span className="syntax-tag">&lt;iframe</span>{'\n'}        <span className="syntax-key">src</span>=<span className="syntax-string">&quot;{fullEndpoint}&quot;</span>{'\n'}        <span className="syntax-key">allow</span>=<span className="syntax-string">&quot;autoplay; fullscreen&quot;</span>{'\n'}        <span className="syntax-key">allowFullScreen</span>{'\n'}        <span className="syntax-key">style</span>=<span className="syntax-brace">{'{{'}</span> width: <span className="syntax-string">'100%'</span>, height: <span className="syntax-string">'100%'</span>, border: <span className="syntax-string">'none'</span> <span className="syntax-brace">{'}}'}</span>{'\n'}      <span className="syntax-tag">/&gt;</span>{'\n'}    <span className="syntax-tag">&lt;/div&gt;</span>{'\n'}  ){'\n'}<span className="syntax-brace">{'}'}</span></>}{activeTab === 'iframe' && <><span className="syntax-tag">&lt;iframe</span>{'\n'}  <span className="syntax-key">src</span>=<span className="syntax-string">&quot;{fullEndpoint}&quot;</span>{'\n'}  <span className="syntax-key">allow</span>=<span className="syntax-string">&quot;autoplay; fullscreen; picture-in-picture&quot;</span>{'\n'}  <span className="syntax-key">allowfullscreen</span>{'\n'}  <span className="syntax-key">style</span>=<span className="syntax-string">&quot;width: 100%; height: 100vh; border: none;&quot;</span>{'\n'}<span className="syntax-tag">/&gt;</span></>}</pre><button className="copy-code-btn" onClick={copyCode} aria-label="Copy code">{codeCopied ? <Check size={16} /> : <Copy size={16} />}</button></div></div></div></section>

      <footer id="status"><div className="brand"><Image src="/logo.png" alt="FWAnime" width={24} height={24} className="brand-logo" /><span>FWAnime</span></div><span className="footer-copy">A tiny API for a world of stories.</span><span className="footer-status"><span className="status-dot" /> All systems operational</span></footer>
    </main>
  )
}
