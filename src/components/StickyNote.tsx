import { useRef, useCallback, useState, useEffect } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { type Note, COLOR_MAP, COLOR_MAP_DARK, COLOR_TOP_STRIP, COLOR_TOP_STRIP_DARK, formatTimestamp } from '../utils/helpers'

interface StickyNoteProps {
  note: Note
  rotation: number
  dimmed: boolean
  zoom: number
  /** When provided, note renders at these screen-space coords (for pinned overlay) */
  screenPosition?: { x: number; y: number }
  /** Custom move commit for pinned overlay (converts screen -> canvas coords) */
  onMoveCommit?: (id: string, x: number, y: number) => void
}

export default function StickyNote({ note, rotation, dimmed, zoom, screenPosition, onMoveCommit }: StickyNoteProps) {
  const updateNote = useNoteStore((s) => s.updateNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const cycleColor = useNoteStore((s) => s.cycleColor)
  const moveNote = useNoteStore((s) => s.moveNote)
  const resizeNote = useNoteStore((s) => s.resizeNote)
  const togglePin = useNoteStore((s) => s.togglePin)
  const selectedNoteId = useNoteStore((s) => s.selectedNoteId)
  const editingNoteId = useNoteStore((s) => s.editingNoteId)
  const setSelectedNote = useNoteStore((s) => s.setSelectedNote)
  const setEditingNote = useNoteStore((s) => s.setEditingNote)
  const darkMode = useNoteStore((s) => s.darkMode)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStarted = useRef(false)

  const isSelected = selectedNoteId === note.id
  const isEditing = editingNoteId === note.id
  const isPinned = note.pinned

  // Use screen-space coords for pinned overlay, canvas-space otherwise
  const posX = screenPosition ? screenPosition.x : note.x
  const posY = screenPosition ? screenPosition.y : note.y

  // Motion values for smooth drag — updates bypass React rendering
  const motionX = useMotionValue(posX)
  const motionY = useMotionValue(posY)

  // Sync motion values when position changes
  useEffect(() => {
    if (!isDragging) {
      motionX.set(posX)
      motionY.set(posY)
    }
  }, [posX, posY, isDragging, motionX, motionY])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(note.id, { content: value })
      }, 300)
    },
    [note.id, updateNote]
  )

  // Custom pointer-based drag for maximum smoothness
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditing || isResizing) return
      // Only drag from left mouse button
      if (e.button !== 0) return
      // Don't start drag from buttons or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button')) return

      e.preventDefault()
      dragStarted.current = false
      const startX = e.clientX
      const startY = e.clientY
      const originX = motionX.get()
      const originY = motionY.get()

      const handleMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / zoom
        const dy = (ev.clientY - startY) / zoom

        // Only start visual drag after a small threshold to distinguish from clicks
        if (!dragStarted.current && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
          dragStarted.current = true
          setIsDragging(true)
          setSelectedNote(note.id)
        }

        if (dragStarted.current) {
          motionX.set(originX + dx)
          motionY.set(originY + dy)
        }
      }

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)

        if (dragStarted.current) {
          // Commit final position
          if (onMoveCommit) {
            onMoveCommit(note.id, motionX.get(), motionY.get())
          } else {
            moveNote(note.id, motionX.get(), motionY.get())
          }
          setIsDragging(false)
        }
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [isEditing, isResizing, zoom, note.id, motionX, motionY, moveNote, onMoveCommit, setSelectedNote]
  )

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setIsResizing(true)
      const startX = e.clientX
      const startY = e.clientY
      const startW = note.width
      const startH = note.height

      const handleMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / zoom
        const dy = (ev.clientY - startY) / zoom
        resizeNote(note.id, startW + dx, startH + dy)
      }

      const handleUp = () => {
        setIsResizing(false)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [note.id, note.width, note.height, zoom, resizeNote]
  )

  const handleNoteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!dragStarted.current) {
        setSelectedNote(note.id)
      }
    },
    [note.id, setSelectedNote]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setEditingNote(note.id)
    },
    [note.id, setEditingNote]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deleteNote(note.id)
    },
    [note.id, deleteNote]
  )

  const handleColorClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      cycleColor(note.id)
    },
    [note.id, cycleColor]
  )

  const handlePinClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      togglePin(note.id)
    },
    [note.id, togglePin]
  )

  const bgColor = darkMode ? COLOR_MAP_DARK[note.color] : COLOR_MAP[note.color]
  const stripColor = darkMode ? COLOR_TOP_STRIP_DARK[note.color] : COLOR_TOP_STRIP[note.color]

  return (
    <motion.div
      data-note-id={note.id}
      className="absolute note-curl"
      style={{
        x: motionX,
        y: motionY,
        width: note.width,
        height: note.height,
        zIndex: isDragging ? 1000 : isSelected ? 500 : isPinned ? 100 : 1,
        left: 0,
        top: 0,
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        opacity: dimmed ? 0.2 : 1,
        rotate: isHovered || isDragging || isEditing ? 0 : rotation,
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 25 },
        opacity: { duration: 0.2 },
        rotate: { type: 'spring', stiffness: 200, damping: 25 },
      }}
      onPointerDown={handlePointerDown}
      onClick={handleNoteClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`w-full h-full rounded-lg note-texture relative select-none flex flex-col ${isPinned ? 'note-pinned' : isDragging ? 'note-shadow-drag' : 'note-shadow'}`}
        style={{
          backgroundColor: bgColor,
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Top adhesive strip */}
        <div
          className="relative h-6 rounded-t-lg cursor-pointer flex items-center px-2 shrink-0"
          style={{ backgroundColor: stripColor, opacity: 0.6 }}
          onClick={handleColorClick}
          title="Click to change color"
        />

        {/* Pin button — top left */}
        <button
          className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded-full text-xs z-10 transition-opacity"
          style={{
            opacity: isPinned ? 1 : 0,
            color: isPinned ? '#d97706' : '#666',
            backgroundColor: isPinned ? 'rgba(217,119,6,0.1)' : 'rgba(0,0,0,0.08)',
          }}
          onClick={handlePinClick}
          title={isPinned ? 'Unpin note' : 'Pin note'}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { if (!isPinned) e.currentTarget.style.opacity = '0' }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill={isPinned ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 17v5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
          </svg>
        </button>

        {/* Delete button — top right */}
        <button
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity z-10"
          style={{ color: '#666', backgroundColor: 'rgba(0,0,0,0.08)' }}
          onClick={handleDelete}
          title="Archive note"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          ×
        </button>

        {/* Content area */}
        <div className="px-3 pt-2 pb-1 flex-1 min-h-0 overflow-hidden">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="note-input"
              defaultValue={note.content}
              onChange={handleContentChange}
              onBlur={() => {
                if (saveTimer.current) {
                  clearTimeout(saveTimer.current)
                  updateNote(note.id, { content: textareaRef.current?.value || '' })
                }
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Type something..."
            />
          ) : (
            <div
              className="w-full h-full overflow-hidden cursor-text"
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: '1.15rem',
                lineHeight: 1.4,
                color: darkMode ? '#e0e0e0' : '#333',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {note.content || (
                <span style={{ color: darkMode ? '#666' : '#aaa' }}>Double-click to edit...</span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className="px-3 pb-1 text-xs shrink-0"
          style={{ color: darkMode ? '#888' : '#999', fontFamily: "'DM Sans', sans-serif" }}
        >
          {formatTimestamp(note.updatedAt)}
        </div>

        {/* Resize handle */}
        <div
          className="resize-handle"
          onPointerDown={handleResizeStart}
        />
      </div>
    </motion.div>
  )
}
