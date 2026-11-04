'use client'

import { useEffect } from 'react'

export default function DevtoolDisabler() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV === 'production') {
      import('disable-devtool').then((DisableDevtool) => {
        DisableDevtool.default({
          // Disable right-click
          disableMenu: true,
          // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
          disableSelect: true,
          // Disable copy
          disableCopy: true,
          // Disable cut
          disableCut: true,
          // Disable paste
          disablePaste: false,
          // Clear console logs
          clearLog: true,
          // Custom message when devtools detected
          url: '/',
          // Redirect on detection
          ondevtoolopen: (type) => {
            console.clear()
            // Optionally redirect or take other actions
          },
          // Disable devtools detection methods
          detectors: 'all', // Use all detection methods
          // Clear interval for detection (ms)
          interval: 1000,
          // Disable source view
          disableIframeParents: true,
          // Disable all devtools
          tkName: 'dd',
        })
      })
    }
  }, [])

  return null
}
