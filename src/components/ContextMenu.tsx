import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { NOTE_COLORS, type NoteColor } from '../utils/helpers'
import { getTheme } from '../utils/customization'

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

  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
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

  // Resolve a DOM element + screen coords into a MenuTarget (or null if not applicable)
  const resolveTarget = useCallback((el: HTMLElement, clientX: number, clientY: number): MenuTarget | null => {
    const noteEl = el.closest('[data-note-id]')
    if (noteEl) {
      return { type: 'note', noteId: noteEl.getAttribute('data-note-id')! }
    }
    const canvasEl = el.closest('[data-canvas]')
    if (canvasEl) {
      const { canvasX, canvasY, zoom } = useNoteStore.getState()
      const rect = canvasEl.getBoundingClientRect()
      const cx = (clientX - rect.left - canvasX) / zoom
      const cy = (clientY - rect.top - canvasY) / zoom
      return { type: 'canvas', canvasX: cx, canvasY: cy }
    }
    return null
  }, [])

  const openMenuAt = useCallback((clientX: number, clientY: number, target: MenuTarget) => {
    setMenu({ visible: true, x: clientX, y: clientY, target })
    setSubmenu(null)
    setFocusedIndex(-1)
    setAdjusted(null)
  }, [])

  // Global contextmenu listener
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = resolveTarget(e.target as HTMLElement, e.clientX, e.clientY)
      if (target) {
        e.preventDefault()
        openMenuAt(e.clientX, e.clientY, target)
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [resolveTarget, openMenuAt])

  // Mobile long-press (500ms hold) to open context menu
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStart = useRef<{ x: number; y: number; target: HTMLElement } | null>(null)
  const longPressFired = useRef(false)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      const touch = e.touches[0]
      const el = e.target as HTMLElement
      touchStart.current = { x: touch.clientX, y: touch.clientY, target: el }
      longPressFired.current = false

      longPressTimer.current = setTimeout(() => {
        const resolved = resolveTarget(el, touch.clientX, touch.clientY)
        if (resolved) {
          longPressFired.current = true
          openMenuAt(touch.clientX, touch.clientY, resolved)
        }
      }, 500)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current || !longPressTimer.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      // Prevent the click/tap that follows a long-press from firing
      if (longPressFired.current) {
        e.preventDefault()
        longPressFired.current = false
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [resolveTarget, openMenuAt])

  // Close on click outside, scroll, resize
  useEffect(() => {
    if (!menu.visible) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = 'touches' in e ? e.touches[0] : e
      const el = (e.target || target) as Node
      if (menuRef.current && !menuRef.current.contains(el)) {
        closeMenu()
      }
    }
    const handleScroll = () => closeMenu()
    const handleResize = () => closeMenu()

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown as EventListener)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown as EventListener)
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

  const menuBg = theme.menuBg
  const menuShadow = theme.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)'
  const textColor = theme.text
  const hoverBg = theme.menuHoverBg
  const dividerColor = theme.menuBorder

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
            zIndex: 9999,
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
              isDark={theme.isDark}
              noteColors={theme.noteColors}
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
              isDark={theme.isDark}
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
  isDark,
  noteColors,
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
  isDark: boolean
  noteColors: Record<NoteColor, string>
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
                const bg = noteColors[color]
                return (
                  <button
                    key={color}
                    className="rounded-full transition-transform"
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: bg,
                      border: isActive
                        ? `2px solid ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)'}`
                        : `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                      transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isActive ? `0 0 0 2px ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => onColorSelect(color)}
                    title={color}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#fff' : '#333'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
  isDark,
  submenu,
  focusedIndex,
  textColor,
  hoverBg,
  dividerColor,
  onAction,
}: {
  isDark: boolean
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
        <p style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e0e0e0' : '#333', marginBottom: 2 }}>
          Clear all notes?
        </p>
        <p style={{ fontSize: 11, color: isDark ? '#999' : '#888', marginBottom: 10 }}>
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
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              outline: focusedIndex === 0 ? `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}` : 'none',
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
