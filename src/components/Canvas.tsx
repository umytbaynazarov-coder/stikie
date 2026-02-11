import { useRef, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { type NoteColor } from '../utils/helpers'
import StickyNote from './StickyNote'

export default function Canvas() {
  const allNotes = useNoteStore((s) => s.notes)
  const canvasX = useNoteStore((s) => s.canvasX)
  const canvasY = useNoteStore((s) => s.canvasY)
  const zoom = useNoteStore((s) => s.zoom)
  const setCanvas = useNoteStore((s) => s.setCanvas)
  const setZoom = useNoteStore((s) => s.setZoom)
  const addNote = useNoteStore((s) => s.addNote)
  const moveNote = useNoteStore((s) => s.moveNote)
  const searchQuery = useNoteStore((s) => s.searchQuery)
  const activeColorFilters = useNoteStore((s) => s.activeColorFilters)
  const setSelectedNote = useNoteStore((s) => s.setSelectedNote)
  const setEditingNote = useNoteStore((s) => s.setEditingNote)
  const rotations = useNoteStore((s) => s.rotations)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 })

  // Filter out archived notes, split pinned vs unpinned
  const activeNotes = allNotes.filter((n) => !n.archived)
  const pinnedNotes = activeNotes.filter((n) => n.pinned)
  const unpinnedNotes = activeNotes.filter((n) => !n.pinned)

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current && e.target !== containerRef.current?.firstChild) return
      const rect = containerRef.current!.getBoundingClientRect()
      const x = (e.clientX - rect.left - canvasX) / zoom
      const y = (e.clientY - rect.top - canvasY) / zoom
      addNote(x, y)
    },
    [addNote, canvasX, canvasY, zoom]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current || e.target === containerRef.current?.firstChild) {
        setSelectedNote(null)
        setEditingNote(null)
      }
    },
    [setSelectedNote, setEditingNote]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== containerRef.current && e.target !== containerRef.current?.firstChild) return
      if (e.button !== 0) return
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, cx: canvasX, cy: canvasY }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [canvasX, canvasY]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setCanvas(panStart.current.cx + dx, panStart.current.cy + dy)
    },
    [isPanning, setCanvas]
  )

  const handlePointerUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newZoom = Math.min(2, Math.max(0.5, zoom + delta))
        if (newZoom === zoom) return

        // Zoom toward the cursor position
        const rect = containerRef.current!.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top

        // The world point under the cursor before zoom
        const worldX = (cursorX - canvasX) / zoom
        const worldY = (cursorY - canvasY) / zoom

        // Adjust canvas offset so that same world point stays under cursor
        const newCanvasX = cursorX - worldX * newZoom
        const newCanvasY = cursorY - worldY * newZoom

        setCanvas(newCanvasX, newCanvasY)
        setZoom(newZoom)
      }
    },
    [zoom, canvasX, canvasY, setZoom, setCanvas]
  )

  const query = searchQuery.toLowerCase()

  const isDimmed = (note: { content: string; color: NoteColor }) => {
    const textMiss = query.length > 0 && !note.content.toLowerCase().includes(query)
    const colorMiss = activeColorFilters.length > 0 && !activeColorFilters.includes(note.color)
    return textMiss || colorMiss
  }

  // Handle pinned note drag commit: store screen-space coords directly
  const handlePinnedMoveCommit = useCallback(
    (id: string, screenX: number, screenY: number) => {
      moveNote(id, screenX, screenY)
    },
    [moveNote]
  )

  return (
    <div
      ref={containerRef}
      data-canvas
      className="w-full h-full dot-grid overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      onDoubleClick={handleCanvasDoubleClick}
      onClick={handleCanvasClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Normal notes layer — pans and zooms with canvas */}
      <div
        style={{
          transform: `translate(${canvasX}px, ${canvasY}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'relative',
          width: 0,
          height: 0,
        }}
      >
        <AnimatePresence>
          {unpinnedNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              rotation={rotations[note.id] || 0}
              dimmed={isDimmed(note)}
              zoom={zoom}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pinned notes layer — viewport-fixed, doesn't move with canvas pan */}
      {pinnedNotes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence>
            {pinnedNotes.map((note) => (
              <div key={note.id} style={{ pointerEvents: 'auto' }}>
                <StickyNote
                  note={note}
                  rotation={rotations[note.id] || 0}
                  dimmed={isDimmed(note)}
                  zoom={1}
                  screenPosition={{ x: note.x, y: note.y }}
                  onMoveCommit={handlePinnedMoveCommit}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {activeNotes.length === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
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
              Double-click anywhere or press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+N</kbd>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
