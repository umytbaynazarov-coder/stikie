import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { COLOR_MAP, COLOR_MAP_DARK, COLOR_TOP_STRIP, COLOR_TOP_STRIP_DARK, formatTimestamp } from '../utils/helpers'

export default function ArchivePanel() {
  const open = useNoteStore((s) => s.archivePanelOpen)
  const setOpen = useNoteStore((s) => s.setArchivePanelOpen)
  const notes = useNoteStore((s) => s.notes)
  const archivedNotes = useMemo(
    () => notes
      .filter((n) => n.archived)
      .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [notes]
  )
  const restoreNote = useNoteStore((s) => s.restoreNote)
  const permanentlyDelete = useNoteStore((s) => s.permanentlyDelete)
  const clearArchive = useNoteStore((s) => s.clearArchive)
  const darkMode = useNoteStore((s) => s.darkMode)
  const isMobile = useIsMobile()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, setOpen])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Light backdrop */}
          <motion.div
            className="fixed inset-0 z-45"
            style={{ background: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            className="fixed top-0 right-0 h-full z-50 flex flex-col rounded-l-xl"
            style={{
              width: isMobile ? '100%' : 320,
              background: darkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              fontFamily: "'DM Sans', sans-serif",
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between shrink-0"
              style={{
                borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                background: darkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h2
                className="text-base font-semibold"
                style={{ color: darkMode ? '#e0e0e0' : '#555' }}
              >
                Archive ({archivedNotes.length})
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md transition-colors"
                style={{ color: darkMode ? '#999' : '#999' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = darkMode ? '#ddd' : '#333' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#999' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {archivedNotes.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm" style={{ color: darkMode ? '#666' : '#aaa' }}>
                    No archived stikies
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {archivedNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-lg overflow-hidden"
                      style={{ backgroundColor: darkMode ? COLOR_MAP_DARK[note.color] : COLOR_MAP[note.color] }}
                    >
                      {/* Color strip */}
                      <div
                        className="h-3"
                        style={{ backgroundColor: darkMode ? COLOR_TOP_STRIP_DARK[note.color] : COLOR_TOP_STRIP[note.color], opacity: 0.6 }}
                      />
                      {/* Content preview */}
                      <div className="px-3 py-2">
                        <p
                          className="leading-snug"
                          style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: '1rem',
                            color: darkMode ? '#e0e0e0' : '#444',
                          }}
                        >
                          {note.content.slice(0, 50) || 'Empty note'}
                          {note.content.length > 50 ? '...' : ''}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: '#888' }}>
                          Archived {note.archivedAt ? formatTimestamp(note.archivedAt) : ''}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="px-3 pb-2 flex gap-2">
                        <button
                          onClick={() => restoreNote(note.id)}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            color: '#555',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)' }}
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => permanentlyDelete(note.id)}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{
                            backgroundColor: 'rgba(239,68,68,0.08)',
                            color: '#ef4444',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)' }}
                        >
                          Delete Forever
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Clear Archive */}
            {archivedNotes.length > 0 && (
              <div
                className="p-3 border-t shrink-0"
                style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              >
                <button
                  onClick={clearArchive}
                  className="w-full text-center text-sm py-2 rounded-lg transition-colors"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.06)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Clear Archive ({archivedNotes.length})
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
