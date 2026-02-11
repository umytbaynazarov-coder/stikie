import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { NOTE_COLORS, COLOR_MAP, COLOR_MAP_DARK, type NoteColor } from '../utils/helpers'

type MenuTarget =
  | { type: 'note'; noteId: string }
  | { type: 'canvas'; canvasX: number; canvasY: number }

type Submenu = 'color' | 'clearConfirm' | null

interface MenuState {
  visible: boolean
  x: number
  y: number
  target: MenuTarget | null
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0, target: null })
  const [submenu, setSubmenu] = useState<Submenu>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjusted, setAdjusted] = useState<{ x: number; y: number } | null>(null)

  const darkMode = useNoteStore((s) => s.darkMode)
  const notes = useNoteStore((s) => s.notes)
  const addNote = useNoteStore((s) => s.addNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const updateNote = useNoteStore((s) => s.updateNote)
  const togglePin = useNoteStore((s) => s.togglePin)
  const duplicateNote = useNoteStore((s) => s.duplicateNote)
  const rearrangeNotes = useNoteStore((s) => s.rearrangeNotes)
  const clearAllNotes = useNoteStore((s) => s.clearAllNotes)

  const closeMenu = useCallback(() => {
    setMenu({ visible: false, x: 0, y: 0, target: null })
    setSubmenu(null)
    setFocusedIndex(-1)
    setAdjusted(null)
  }, [])

  // Global contextmenu listener
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Check if right-clicked on a sticky note
      const noteEl = target.closest('[data-note-id]')
      if (noteEl) {
        e.preventDefault()
        const noteId = noteEl.getAttribute('data-note-id')!
        setMenu({ visible: true, x: e.clientX, y: e.clientY, target: { type: 'note', noteId } })
        setSubmenu(null)
        setFocusedIndex(-1)
        setAdjusted(null)
        return
      }

      // Check if right-clicked on canvas
      const canvasEl = target.closest('[data-canvas]')
      if (canvasEl) {
        e.preventDefault()
        const { canvasX, canvasY, zoom } = useNoteStore.getState()
        const rect = canvasEl.getBoundingClientRect()
        const cx = (e.clientX - rect.left - canvasX) / zoom
        const cy = (e.clientY - rect.top - canvasY) / zoom
        setMenu({ visible: true, x: e.clientX, y: e.clientY, target: { type: 'canvas', canvasX: cx, canvasY: cy } })
        setSubmenu(null)
        setFocusedIndex(-1)
        setAdjusted(null)
        return
      }

      // Allow browser default for other areas
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  // Close on click outside, scroll, resize
  useEffect(() => {
    if (!menu.visible) return

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    const handleScroll = () => closeMenu()
    const handleResize = () => closeMenu()

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [menu.visible, closeMenu])

  // Keyboard navigation (capture phase to intercept before useKeyboardShortcuts)
  useEffect(() => {
    if (!menu.visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        if (submenu) {
          setSubmenu(null)
        } else {
          closeMenu()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setFocusedIndex((prev) => {
          const count = getItemCount()
          return prev < count - 1 ? prev + 1 : 0
        })
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setFocusedIndex((prev) => {
          const count = getItemCount()
          return prev > 0 ? prev - 1 : count - 1
        })
        return
      }

      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        e.stopPropagation()
        handleItemAction(focusedIndex)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [menu.visible, submenu, focusedIndex, closeMenu])

  // Edge detection — adjust position after render
  useLayoutEffect(() => {
    if (!menu.visible || !menuRef.current) {
      setAdjusted(null)
      return
    }
    const rect = menuRef.current.getBoundingClientRect()
    const MARGIN = 8
    let ax = menu.x
    let ay = menu.y
    if (menu.x + rect.width > window.innerWidth - MARGIN) ax = menu.x - rect.width
    if (menu.y + rect.height > window.innerHeight - MARGIN) ay = menu.y - rect.height
    ax = Math.max(MARGIN, ax)
    ay = Math.max(MARGIN, ay)
    if (ax !== menu.x || ay !== menu.y) {
      setAdjusted({ x: ax, y: ay })
    }
  }, [menu.visible, menu.x, menu.y, submenu])

  const getItemCount = () => {
    if (!menu.target) return 0
    if (submenu === 'clearConfirm') return 2 // Cancel, Clear All
    if (menu.target.type === 'note') return 4 // Change Color, Pin, Duplicate, Delete
    return 3 // New Note, Rearrange, Clear All
  }

  const handleItemAction = (index: number) => {
    if (!menu.target) return

    if (menu.target.type === 'note') {
      const noteId = menu.target.noteId
      switch (index) {
        case 0: setSubmenu(submenu === 'color' ? null : 'color'); return
        case 1: togglePin(noteId); closeMenu(); return
        case 2: duplicateNote(noteId); closeMenu(); return
        case 3: deleteNote(noteId); closeMenu(); return
      }
    } else {
      if (submenu === 'clearConfirm') {
        switch (index) {
          case 0: setSubmenu(null); return
          case 1: clearAllNotes(); closeMenu(); return
        }
      } else {
        switch (index) {
          case 0: addNote(menu.target.canvasX, menu.target.canvasY); closeMenu(); return
          case 1: rearrangeNotes(); closeMenu(); return
          case 2: setSubmenu('clearConfirm'); return
        }
      }
    }
  }

  const activeNote = menu.target?.type === 'note'
    ? notes.find((n) => n.id === (menu.target as { type: 'note'; noteId: string }).noteId)
    : null

  const posX = adjusted?.x ?? menu.x
  const posY = adjusted?.y ?? menu.y

  const menuBg = darkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)'
  const menuShadow = darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)'
  const textColor = darkMode ? '#e0e0e0' : '#555'
  const hoverBg = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const dividerColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return createPortal(
    <AnimatePresence>
      {menu.visible && menu.target && (
        <motion.div
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left: posX,
            top: posY,
            zIndex: 70,
            fontFamily: "'DM Sans', sans-serif",
            background: menuBg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: menuShadow,
            borderRadius: 10,
            padding: 4,
            minWidth: 180,
            userSelect: 'none',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {menu.target.type === 'note' ? (
            <NoteMenuItems
              note={activeNote!}
              darkMode={darkMode}
              submenu={submenu}
              focusedIndex={focusedIndex}
              textColor={textColor}
              hoverBg={hoverBg}
              dividerColor={dividerColor}
              onAction={handleItemAction}
              onColorSelect={(color) => {
                if (activeNote) {
                  updateNote(activeNote.id, { color })
                  closeMenu()
                }
              }}
              onSubmenuToggle={() => setSubmenu(submenu === 'color' ? null : 'color')}
            />
          ) : (
            <CanvasMenuItems
              darkMode={darkMode}
              submenu={submenu}
              focusedIndex={focusedIndex}
              textColor={textColor}
              hoverBg={hoverBg}
              dividerColor={dividerColor}
              onAction={handleItemAction}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// --- Menu Item Component ---

function MenuItem({
  icon,
  label,
  focused,
  danger,
  textColor,
  hoverBg,
  expanded,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  focused: boolean
  danger?: boolean
  textColor: string
  hoverBg: string
  expanded?: boolean
  onClick: () => void
}) {
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [focused])

  return (
    <div
      ref={itemRef}
      role="menuitem"
      className="flex items-center gap-2.5 px-3 rounded-md cursor-pointer transition-colors"
      style={{
        height: 36,
        fontSize: 13,
        color: danger ? '#ef4444' : textColor,
        backgroundColor: focused ? hoverBg : 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!focused) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg
      }}
      onMouseLeave={(e) => {
        if (!focused) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
      }}
      aria-expanded={expanded}
    >
      <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {expanded !== undefined && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s ease' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </div>
  )
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: 1, margin: '4px 8px', backgroundColor: color }} />
}

// --- Note Menu ---

function NoteMenuItems({
  note,
  darkMode,
  submenu,
  focusedIndex,
  textColor,
  hoverBg,
  dividerColor,
  onAction,
  onColorSelect,
  onSubmenuToggle,
}: {
  note: { id: string; pinned: boolean; color: NoteColor } | null
  darkMode: boolean
  submenu: Submenu
  focusedIndex: number
  textColor: string
  hoverBg: string
  dividerColor: string
  onAction: (index: number) => void
  onColorSelect: (color: NoteColor) => void
  onSubmenuToggle: () => void
}) {
  if (!note) return null

  return (
    <>
      {/* Change Color */}
      <MenuItem
        icon={<PaletteIcon />}
        label="Change Color"
        focused={focusedIndex === 0}
        textColor={textColor}
        hoverBg={hoverBg}
        expanded={submenu === 'color'}
        onClick={onSubmenuToggle}
      />

      {/* Color swatches */}
      <AnimatePresence>
        {submenu === 'color' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex items-center justify-center gap-2 py-2 px-3">
              {NOTE_COLORS.map((color) => {
                const isActive = color === note.color
                const bg = darkMode ? COLOR_MAP_DARK[color] : COLOR_MAP[color]
                return (
                  <button
                    key={color}
                    className="rounded-full transition-transform"
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: bg,
                      border: isActive
                        ? `2px solid ${darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)'}`
                        : `1.5px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                      transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isActive ? `0 0 0 2px ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => onColorSelect(color)}
                    title={color}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#333'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pin */}
      <MenuItem
        icon={<PinIcon />}
        label={note.pinned ? 'Unpin' : 'Pin to Top'}
        focused={focusedIndex === 1}
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(1)}
      />

      {/* Duplicate */}
      <MenuItem
        icon={<DuplicateIcon />}
        label="Duplicate Note"
        focused={focusedIndex === 2}
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(2)}
      />

      <Divider color={dividerColor} />

      {/* Delete */}
      <MenuItem
        icon={<TrashIcon />}
        label="Delete Note"
        focused={focusedIndex === 3}
        danger
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(3)}
      />
    </>
  )
}

// --- Canvas Menu ---

function CanvasMenuItems({
  darkMode,
  submenu,
  focusedIndex,
  textColor,
  hoverBg,
  dividerColor,
  onAction,
}: {
  darkMode: boolean
  submenu: Submenu
  focusedIndex: number
  textColor: string
  hoverBg: string
  dividerColor: string
  onAction: (index: number) => void
}) {
  if (submenu === 'clearConfirm') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        style={{ padding: '8px 12px' }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: darkMode ? '#e0e0e0' : '#333', marginBottom: 2 }}>
          Clear all notes?
        </p>
        <p style={{ fontSize: 11, color: darkMode ? '#999' : '#888', marginBottom: 10 }}>
          This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md transition-colors"
            style={{
              height: 32,
              fontSize: 12,
              fontWeight: 500,
              color: textColor,
              backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              outline: focusedIndex === 0 ? `2px solid ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}` : 'none',
            }}
            onClick={() => onAction(0)}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-md transition-colors"
            style={{
              height: 32,
              fontSize: 12,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              outline: focusedIndex === 1 ? '2px solid rgba(239,68,68,0.5)' : 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#dc2626' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef4444' }}
            onClick={() => onAction(1)}
          >
            Clear All
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* New Note */}
      <MenuItem
        icon={<PlusIcon />}
        label="New Note Here"
        focused={focusedIndex === 0}
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(0)}
      />

      {/* Rearrange */}
      <MenuItem
        icon={<GridIcon />}
        label="Rearrange All"
        focused={focusedIndex === 1}
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(1)}
      />

      <Divider color={dividerColor} />

      {/* Clear All */}
      <MenuItem
        icon={<TrashIcon />}
        label="Clear All Notes"
        focused={focusedIndex === 2}
        danger
        textColor={textColor}
        hoverBg={hoverBg}
        onClick={() => onAction(2)}
      />
    </>
  )
}

// --- Inline SVG Icons (16x16 viewBox 0 0 24 24, stroke-based) ---

function PaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function DuplicateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}
