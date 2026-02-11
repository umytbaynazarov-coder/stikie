import { useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'

import { useNoteStore } from '../store/useNoteStore'
import { COLOR_MAP, COLOR_MAP_DARK, COLOR_TOP_STRIP, COLOR_TOP_STRIP_DARK, formatTimestamp, type NoteColor } from '../utils/helpers'

export default function MobileView() {
  const allNotes = useNoteStore((s) => s.notes)
  const addNote = useNoteStore((s) => s.addNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const updateNote = useNoteStore((s) => s.updateNote)
  const cycleColor = useNoteStore((s) => s.cycleColor)
  const togglePin = useNoteStore((s) => s.togglePin)
  const searchQuery = useNoteStore((s) => s.searchQuery)
  const activeColorFilters = useNoteStore((s) => s.activeColorFilters)
  const darkMode = useNoteStore((s) => s.darkMode)

  const query = searchQuery.toLowerCase()

  // Filter out archived, then apply search + color filters
  const activeNotes = allNotes.filter((n) => !n.archived)
  const filteredNotes = activeNotes.filter((n) => {
    const matchesText = !query || n.content.toLowerCase().includes(query)
    const matchesColor = activeColorFilters.length === 0 || activeColorFilters.includes(n.color)
    return matchesText && matchesColor
  })

  const pinnedNotes = filteredNotes.filter((n) => n.pinned)
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned)

  return (
    <div className="w-full h-full overflow-y-auto px-4 pb-24">
      {filteredNotes.length === 0 && activeNotes.length === 0 && (
        <motion.div
          className="flex items-center justify-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-center">
            <p className="text-2xl text-gray-400 mb-1 font-semibold" style={{ fontFamily: "'Caveat', cursive" }}>
              stikie
            </p>
            <p className="text-gray-400 mb-3" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>
              The fastest way to capture a thought.
            </p>
            <p className="text-xs text-gray-400/70 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              No sign-up. No cloud. Just you and your notes.
            </p>
            <p className="text-sm text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Tap <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full text-xs font-bold">+</span> to start
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-3 pt-2">
        {/* Pinned section */}
        {pinnedNotes.length > 0 && (
          <>
            <div
              className="text-[10px] text-gray-400 uppercase tracking-wider px-1 flex items-center gap-1.5 pt-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
              </svg>
              Pinned
            </div>
            <AnimatePresence>
              {pinnedNotes.map((note) => (
                <MobileNote
                  key={note.id}
                  note={note}
                  onDelete={() => deleteNote(note.id)}
                  onUpdate={(content) => updateNote(note.id, { content })}
                  onCycleColor={() => cycleColor(note.id)}
                  onTogglePin={() => togglePin(note.id)}
                  darkMode={darkMode}
                />
              ))}
            </AnimatePresence>
            {unpinnedNotes.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700" />
            )}
          </>
        )}

        {/* Unpinned section */}
        <AnimatePresence>
          {unpinnedNotes.map((note) => (
            <MobileNote
              key={note.id}
              note={note}
              onDelete={() => deleteNote(note.id)}
              onUpdate={(content) => updateNote(note.id, { content })}
              onCycleColor={() => cycleColor(note.id)}
              onTogglePin={() => togglePin(note.id)}
              darkMode={darkMode}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => addNote()}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{
          background: '#333',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.5rem',
        }}
      >
        +
      </button>
    </div>
  )
}

interface MobileNoteProps {
  note: { id: string; content: string; color: NoteColor; updatedAt: number; pinned: boolean }
  onDelete: () => void
  onUpdate: (content: string) => void
  onCycleColor: () => void
  onTogglePin: () => void
  darkMode: boolean
}

function MobileNote({ note, onDelete, onUpdate, onCycleColor, onTogglePin, darkMode }: MobileNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0.3, 1, 0.3])
  const bgColor = darkMode ? COLOR_MAP_DARK[note.color] : COLOR_MAP[note.color]
  const stripColor = darkMode ? COLOR_TOP_STRIP_DARK[note.color] : COLOR_TOP_STRIP[note.color]

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (Math.abs(info.offset.x) > 100) {
        onDelete()
      }
    },
    [onDelete]
  )

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => onUpdate(value), 300)
    },
    [onUpdate]
  )

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`rounded-lg overflow-hidden ${note.pinned ? 'note-pinned' : 'note-shadow'}`}
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="h-5 flex items-center px-2 gap-2"
          style={{ backgroundColor: stripColor, opacity: 0.6 }}
        >
          <div
            className="w-3 h-3 rounded-full border border-black/10 cursor-pointer"
            style={{ backgroundColor: stripColor }}
            onClick={onCycleColor}
          />
          <div className="flex-1" />
          {/* Pin toggle */}
          <button
            onClick={onTogglePin}
            className="flex items-center justify-center"
            style={{ color: note.pinned ? '#d97706' : '#999' }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill={note.pinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
            </svg>
          </button>
        </div>
        <div
          className="px-3 py-2 min-h-[80px]"
          onClick={() => {
            setIsEditing(true)
            setTimeout(() => textareaRef.current?.focus(), 50)
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="note-input min-h-[60px]"
              defaultValue={note.content}
              onChange={handleContentChange}
              onBlur={() => {
                if (saveTimer.current) {
                  clearTimeout(saveTimer.current)
                  onUpdate(textareaRef.current?.value || '')
                }
                setIsEditing(false)
              }}
              placeholder="Type something..."
            />
          ) : (
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '1.1rem',
                lineHeight: 1.4,
                color: darkMode ? '#e0e0e0' : '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minHeight: 60,
              }}
            >
              {note.content || <span style={{ color: darkMode ? '#666' : '#aaa' }}>Tap to edit...</span>}
            </div>
          )}
        </div>
        <div className="px-3 pb-1.5 flex justify-between items-center">
          <span className="text-[10px] text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {formatTimestamp(note.updatedAt)}
          </span>
          <span className="text-[10px] text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            swipe to archive
          </span>
        </div>
      </div>
    </motion.div>
  )
}
