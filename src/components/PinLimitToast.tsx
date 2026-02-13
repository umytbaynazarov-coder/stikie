import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { getTheme } from '../utils/customization'

export default function PinLimitToast() {
  const show = useNoteStore((s) => s.pinLimitToast)
  const setShow = useNoteStore((s) => s.setPinLimitToast)
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [show, setShow])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-60"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              background: theme.isDark ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <span className="text-sm" style={{ color: theme.text }}>Maximum 5 pinned notes</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
