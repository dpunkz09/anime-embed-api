'use client'

import { useState } from 'react'
import { Menu, X, GitBranch, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  currentPage?: 'home' | 'docs'
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="FWAnime home">
        <Image 
          src="/logo.png" 
          alt="FWAnime" 
          width={28} 
          height={28}
          className="brand-logo"
        />
        <span>FWAnime</span>
      </Link>
      
      <nav className={mobileOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
        <Link 
          className={currentPage === 'home' ? 'nav-active' : ''} 
          href="/#playground"
        >
          Playground
        </Link>
        <Link 
          className={currentPage === 'docs' ? 'nav-active' : ''} 
          href="/docs"
        >
          Docs
        </Link>
      </nav>
      
      <div className="top-actions">
        <a className="icon-link" href="https://github.com" aria-label="GitHub">
          <GitBranch size={17} />
        </a>
        <Link className="docs-btn" href="/docs">
          Read the docs <ExternalLink size={14} />
        </Link>
        <button 
          className="menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)} 
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  )
}
