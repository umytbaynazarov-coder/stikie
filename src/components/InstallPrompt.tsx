import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from '../hooks/usePWAInstall'

export default function InstallPrompt() {
  const { canInstall, install, dismiss } = usePWAInstall()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!canInstall) return
    // Wait 30s before showing — don't interrupt first impression
    const timer = setTimeout(() => setShow(true), 30000)
    return () => clearTimeout(timer)
  }, [canInstall])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 right-4 z-50"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{
              background: 'rgba(40,40,40,0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="text-sm text-white">Install app</span>
            <button
              onClick={install}
              className="text-sm font-semibold px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: '#ffd666' }}
            >
              Install
            </button>
            <button
              onClick={() => { dismiss(); setShow(false) }}
              className="text-white/40 hover:text-white/70 transition-colors text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
