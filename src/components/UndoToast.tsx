import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'

export default function UndoToast() {
  const deletedStack = useNoteStore((s) => s.deletedStack)
  const undoDelete = useNoteStore((s) => s.undoDelete)
  const [visible, setVisible] = useState(false)
  const [lastLength, setLastLength] = useState(0)

  useEffect(() => {
    if (deletedStack.length > lastLength) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(timer)
    }
    setLastLength(deletedStack.length)
  }, [deletedStack.length, lastLength])

  const handleUndo = useCallback(() => {
    undoDelete()
    setVisible(false)
  }, [undoDelete])

  return (
    <AnimatePresence>
      {visible && deletedStack.length > 0 && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-60"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.2 }}
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
            <span className="text-sm" style={{ color: '#e0e0e0' }}>Stikie archived</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: '#ffd666' }}
            >
              Undo
            </button>
            <span className="text-xs text-gray-400">Ctrl+Z</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
