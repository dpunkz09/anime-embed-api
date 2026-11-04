// components/DisableDevtool.tsx
'use client'

import { useEffect } from 'react'

export default function DisableDevtool() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    import('disable-devtool').then(({ default: disableDevtool }) => {
      disableDevtool({
        md5: process.env.NEXT_PUBLIC_DDTK_MD5, // bypass token (hashed)
        tkName: 'ddtk',                        // URL param name for the bypass
        disableMenu: true,                     // block right-click
        clearLog: true,
        url: 'https://anime.flixworld.xyz',                       // where to go if the page can't be closed
      })
    })
  }, [])

  return null
}