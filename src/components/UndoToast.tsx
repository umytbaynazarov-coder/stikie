import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { getTheme } from '../utils/customization'

export default function UndoToast() {
  const deletedStack = useNoteStore((s) => s.deletedStack)
  const undoDelete = useNoteStore((s) => s.undoDelete)
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
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
              background: theme.isDark ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: theme.isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <span className="text-sm" style={{ color: theme.text }}>Stikie archived</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{ color: theme.isDark ? '#ffd666' : '#d97706' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Undo
            </button>
            <span className="text-xs" style={{ color: theme.textMuted }}>Ctrl+Z</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
