import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { getTheme } from '../utils/customization'
import BottomSheet from './BottomSheet'

type Category = 'palette' | 'canvas' | 'font' | 'layouts' | null

export default function CustomizationToolbar() {
  const [activeCategory, setActiveCategory] = useState<Category>(null)
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setVisible(true)
    hideTimer.current = setTimeout(() => {
      if (!hovered) setVisible(false)
    }, 5000)
  }, [hovered])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [resetHideTimer])

  useEffect(() => {
    if (hovered) {
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    } else if (!activeCategory) {
      resetHideTimer()
    }
  }, [hovered, activeCategory, resetHideTimer])

  useEffect(() => {
    if (activeCategory) {
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    } else {
      resetHideTimer()
    }
  }, [activeCategory, resetHideTimer])

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory((prev) => (prev === cat ? null : cat))
  }

  const handleSheetClose = () => {
    setActiveCategory(null)
  }

  return (
    <>
      {/* Hover trigger zone (always present) */}
      <div
        className="fixed bottom-0 left-0 z-50"
        style={{ width: 240, height: 80 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence>
          {(visible || hovered || activeCategory) && (
            <motion.div
              className="absolute bottom-4 left-4 flex items-center gap-1 rounded-2xl px-2 py-2"
              style={{
                background: theme.isDark
                  ? 'rgba(20,20,20,0.55)'
                  : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)'}`,
                boxShadow: theme.isDark
                  ? '0 4px 24px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.06)'
                  : '0 4px 24px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.8)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <ToolbarButton
                icon={<PaletteIcon />}
                label="Palette"
                active={activeCategory === 'palette'}
                theme={theme}
                onClick={() => handleCategoryClick('palette')}
              />
              <ToolbarButton
                icon={<CanvasIcon />}
                label="Canvas"
                active={activeCategory === 'canvas'}
                theme={theme}
                onClick={() => handleCategoryClick('canvas')}
              />
              <ToolbarButton
                icon={<FontIcon />}
                label="Font"
                active={activeCategory === 'font'}
                theme={theme}
                onClick={() => handleCategoryClick('font')}
              />
              <ToolbarButton
                icon={<LayoutIcon />}
                label="Layouts"
                active={activeCategory === 'layouts'}
                theme={theme}
                onClick={() => handleCategoryClick('layouts')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet category={activeCategory} onClose={handleSheetClose} />
    </>
  )
}

function ToolbarButton({
  icon,
  label,
  active,
  theme,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  theme: ReturnType<typeof getTheme>
  onClick: () => void
}) {
  return (
    <button
      className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors"
      style={{
        color: active ? (theme.isDark ? '#fff' : '#111') : theme.textMuted,
        backgroundColor: active ? theme.menuHoverBg : 'transparent',
      }}
      onClick={onClick}
      title={label}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span
        className="text-[9px] font-medium leading-none"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
    </button>
  )
}

// ── Inline SVG Icons ─────────────────────────────────────────────────

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function CanvasIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
    </svg>
  )
}

function FontIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9.5" y1="20" x2="14.5" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

function LayoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
