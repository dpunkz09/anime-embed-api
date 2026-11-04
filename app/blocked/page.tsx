import { ShieldAlert, Home, FileWarning } from 'lucide-react'
import Link from 'next/link'

export default function BlockedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 60% 35% at 50% -8%, #22282b 0%, transparent 72%), #080a0c',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1f22 0%, #0e1215 100%)',
          border: '1px solid #2a2f33',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e95d63',
        }}>
          <ShieldAlert size={64} strokeWidth={1.5} />
        </div>
        
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          letterSpacing: '-0.05em',
          color: '#eef2f4',
          margin: 0,
        }}>
          Access Restricted
        </h1>
        
        <p style={{
          fontSize: '16px',
          lineHeight: '1.7',
          color: '#8b969b',
          margin: 0,
          maxWidth: '400px',
        }}>
          Developer tools have been detected. This page is protected to ensure content security and prevent unauthorized access.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: '#1a2419',
          borderLeft: '3px solid #6cd491',
          borderRadius: '6px',
          color: '#9ba4a8',
          fontSize: '13px',
          maxWidth: '100%',
        }}>
          <FileWarning size={18} style={{ flexShrink: 0, color: '#6cd491' }} />
          <span>If you believe this is an error, please close this page and try again.</span>
        </div>
        
        <Link 
          href="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            marginTop: '16px',
          }}
        >
          <Home size={18} />
          Return Home
        </Link>
      </div>
    </div>
  )
}
