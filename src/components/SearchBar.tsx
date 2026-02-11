import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { NOTE_COLORS, COLOR_MAP, type NoteColor } from '../utils/helpers'

export default function SearchBar() {
  const searchOpen = useNoteStore((s) => s.searchOpen)
  const searchQuery = useNoteStore((s) => s.searchQuery)
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery)
  const setSearchOpen = useNoteStore((s) => s.setSearchOpen)
  const notes = useNoteStore((s) => s.notes)
  const activeColorFilters = useNoteStore((s) => s.activeColorFilters)
  const setActiveColorFilters = useNoteStore((s) => s.setActiveColorFilters)
  const darkMode = useNoteStore((s) => s.darkMode)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  const activeNotes = notes.filter((n) => !n.archived)
  const matchCount = activeNotes.filter((n) => {
    const matchesText = !searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesColor = activeColorFilters.length === 0 || activeColorFilters.includes(n.color)
    return matchesText && matchesColor
  }).length

  const toggleColor = (color: NoteColor) => {
    if (activeColorFilters.includes(color)) {
      setActiveColorFilters(activeColorFilters.filter((c) => c !== color))
    } else {
      setActiveColorFilters([...activeColorFilters, color])
    }
  }

  const hasActiveFilters = searchQuery || activeColorFilters.length > 0

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed top-14 left-1/2 z-40"
          initial={{ opacity: 0, y: -10, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -10, x: '-50%' }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="rounded-xl backdrop-blur-md"
            style={{
              background: darkMode ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.85)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Search row */}
            <div className="flex items-center gap-2 px-4 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#888' : '#999'} strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false)
                  e.stopPropagation()
                }}
                placeholder="Search notes..."
                className="bg-transparent outline-none text-sm w-56"
                style={{ fontFamily: "'DM Sans', sans-serif", color: darkMode ? '#e0e0e0' : '#333' }}
              />
              {hasActiveFilters && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {matchCount} match{matchCount !== 1 ? 'es' : ''}
                </span>
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Color filter dots */}
            <div className="flex items-center justify-center gap-1.5 px-4 pb-2">
              {NOTE_COLORS.map((color) => {
                const isActive = activeColorFilters.includes(color)
                return (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className="w-4 h-4 rounded-full transition-all"
                    style={{
                      backgroundColor: COLOR_MAP[color],
                      border: isActive
                        ? `2px solid ${darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)'}`
                        : `1.5px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                      boxShadow: isActive
                        ? `0 0 0 2px ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`
                        : 'none',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    }}
                    title={`Filter ${color} notes`}
                  />
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
