import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'

export default function PinLimitToast() {
  const show = useNoteStore((s) => s.pinLimitToast)
  const setShow = useNoteStore((s) => s.setPinLimitToast)

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
              background: 'rgba(40,40,40,0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span className="text-sm" style={{ color: '#e0e0e0' }}>Maximum 5 pinned notes</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
