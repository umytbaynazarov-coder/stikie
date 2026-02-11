import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

declare global {
  interface Window {
    __stikie_start?: number
  }
}

export default function SpeedBadge() {
  const [time, setTime] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show when ?speed is in the URL
    if (!window.location.search.includes('speed')) return
    if (!window.__stikie_start) return

    const elapsed = (performance.now() - window.__stikie_start) / 1000
    setTime(elapsed.toFixed(2))
    setVisible(true)

    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && time && (
        <motion.div
          className="fixed bottom-6 left-4 z-50"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(40,40,40,0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-xs text-white/70">
              Ready in <span className="text-white font-semibold">{time}s</span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
