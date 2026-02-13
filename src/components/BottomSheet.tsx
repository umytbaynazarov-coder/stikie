import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import {
  type ThemeId,
  type CanvasType,
  type FontId,
  type LayoutMode,
  type ThemeConfig,
  THEMES,
  CANVAS_TYPES,
  FONTS,
  LAYOUTS,
  getTheme,
  getFontFamily,
} from '../utils/customization'

type Category = 'palette' | 'canvas' | 'font' | 'layouts' | null

interface BottomSheetProps {
  category: Category
  onClose: () => void
}

export default function BottomSheet({ category, onClose }: BottomSheetProps) {
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)

  return (
    <AnimatePresence>
      {category && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
            style={{
              background: theme.isDark
                ? 'rgba(20,20,20,0.6)'
                : 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(32px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}`,
              borderBottom: 'none',
              boxShadow: theme.isDark
                ? '0 -8px 40px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.06)'
                : '0 -8px 40px rgba(0,0,0,0.1), inset 0 0.5px 0 rgba(255,255,255,0.9)',
              fontFamily: "'DM Sans', sans-serif",
              minHeight: '35vh',
              maxHeight: '50vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}
              />
            </div>

            {category === 'palette' && <PaletteSheet theme={theme} onClose={onClose} />}
            {category === 'canvas' && <CanvasSheet theme={theme} onClose={onClose} />}
            {category === 'font' && <FontSheet theme={theme} onClose={onClose} />}
            {category === 'layouts' && <LayoutSheet theme={theme} onClose={onClose} />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Shared ────────────────────────────────────────────────────────────

function SheetHeader({ title, theme, onCancel, onApply }: {
  title: string
  theme: ThemeConfig
  onCancel: () => void
  onApply: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{title}</h3>
      <div className="flex gap-2">
        <button
          className="px-4 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{ color: theme.textMuted }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            color: theme.text,
          }}
          onClick={onApply}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

function CardBorder(isActive: boolean, isDark: boolean) {
  return isActive
    ? `2.5px solid ${isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)'}`
    : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
}

// ── Palette Sheet ────────────────────────────────────────────────────

function PaletteSheet({ theme, onClose }: { theme: ThemeConfig; onClose: () => void }) {
  const currentTheme = useNoteStore((s) => s.customization.global.theme)
  const setTheme = useNoteStore((s) => s.setTheme)
  const [selected, setSelected] = useState<ThemeId>(currentTheme)
  const originalRef = useRef(currentTheme)

  const handleSelect = (id: ThemeId) => {
    setSelected(id)
    setTheme(id)
  }

  return (
    <div className="px-6 pb-8">
      <SheetHeader
        title="Theme"
        theme={theme}
        onCancel={() => { setTheme(originalRef.current); onClose() }}
        onApply={onClose}
      />
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id]
          const isActive = selected === id
          return (
            <button
              key={id}
              className="rounded-xl overflow-hidden text-left transition-all"
              style={{
                border: CardBorder(isActive, theme.isDark),
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
              onClick={() => handleSelect(id)}
            >
              {/* Theme preview area */}
              <div
                className="relative px-3 pt-3 pb-2"
                style={{ backgroundColor: t.bg, minHeight: 80 }}
              >
                {/* Mini sticky notes fanned out */}
                <div className="relative" style={{ height: 48 }}>
                  {(['yellow', 'pink', 'blue', 'green'] as const).map((color, i) => (
                    <div
                      key={color}
                      className="absolute rounded"
                      style={{
                        width: 32,
                        height: 24,
                        backgroundColor: t.noteColors[color],
                        left: i * 18,
                        top: i % 2 === 0 ? 0 : 8,
                        transform: `rotate(${(i - 1.5) * 4}deg)`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div
                        className="h-1 rounded-t"
                        style={{ backgroundColor: t.noteTopStrip[color], opacity: 0.7 }}
                      />
                    </div>
                  ))}
                </div>
                {/* Text colors preview */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-12 h-1 rounded-full" style={{ backgroundColor: t.text, opacity: 0.6 }} />
                  <div className="w-6 h-1 rounded-full" style={{ backgroundColor: t.textMuted, opacity: 0.5 }} />
                </div>
              </div>
              {/* Label */}
              <div className="px-3 py-2" style={{ backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <p className="text-xs font-medium" style={{ color: t.text }}>
                  {t.label}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: t.textMuted }}>
                  {t.isDark ? 'Dark' : 'Light'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Canvas Sheet ─────────────────────────────────────────────────────

function CanvasSheet({ theme, onClose }: { theme: ThemeConfig; onClose: () => void }) {
  const currentCanvas = useNoteStore((s) => s.customization.global.canvas)
  const setCanvasType = useNoteStore((s) => s.setCanvasType)
  const [selected, setSelected] = useState<CanvasType>(currentCanvas)
  const originalRef = useRef(currentCanvas)

  const handleSelect = (id: CanvasType) => {
    setSelected(id)
    setCanvasType(id)
  }

  return (
    <div className="px-6 pb-8">
      <SheetHeader
        title="Canvas Background"
        theme={theme}
        onCancel={() => { setCanvasType(originalRef.current); onClose() }}
        onApply={onClose}
      />
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(CANVAS_TYPES) as CanvasType[]).map((id) => {
          const c = CANVAS_TYPES[id]
          const isActive = selected === id
          return (
            <button
              key={id}
              className="rounded-xl overflow-hidden text-left transition-all"
              style={{
                border: CardBorder(isActive, theme.isDark),
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
              onClick={() => handleSelect(id)}
            >
              <div
                className={`canvas-${id}`}
                style={{ backgroundColor: theme.bg, height: 72 }}
              />
              <div className="px-3 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <p className="text-xs font-medium" style={{ color: theme.text }}>
                  {c.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Font Sheet ───────────────────────────────────────────────────────

function FontSheet({ theme, onClose }: { theme: ThemeConfig; onClose: () => void }) {
  const currentFont = useNoteStore((s) => s.customization.global.font)
  const setFont = useNoteStore((s) => s.setFont)
  const [selected, setSelected] = useState<FontId>(currentFont)
  const originalRef = useRef(currentFont)

  const handleSelect = (id: FontId) => {
    setSelected(id)
    setFont(id)
  }

  return (
    <div className="px-6 pb-8">
      <SheetHeader
        title="Note Font"
        theme={theme}
        onCancel={() => { setFont(originalRef.current); onClose() }}
        onApply={onClose}
      />
      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(FONTS) as FontId[]).map((id) => {
          const f = FONTS[id]
          const isActive = selected === id
          return (
            <button
              key={id}
              className="rounded-xl overflow-hidden text-left transition-all"
              style={{
                border: CardBorder(isActive, theme.isDark),
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
              onClick={() => handleSelect(id)}
            >
              {/* Font preview on a mini sticky note */}
              <div
                className="px-4 py-3"
                style={{
                  backgroundColor: theme.noteColors.yellow,
                  minHeight: 64,
                }}
              >
                <div
                  className="h-1 rounded-full mb-2 w-full"
                  style={{ backgroundColor: theme.noteTopStrip.yellow, opacity: 0.5 }}
                />
                <p
                  className="leading-snug"
                  style={{
                    fontFamily: getFontFamily(id),
                    fontSize: '1.05rem',
                    color: theme.text,
                  }}
                >
                  {f.sampleText}
                </p>
              </div>
              <div className="px-3 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <p className="text-xs font-medium" style={{ color: theme.text }}>
                  {f.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Layout Sheet ─────────────────────────────────────────────────────

function LayoutSheet({ theme, onClose }: { theme: ThemeConfig; onClose: () => void }) {
  const currentLayout = useNoteStore((s) => s.customization.global.layout)
  const setLayout = useNoteStore((s) => s.setLayout)
  const [selected, setSelected] = useState<LayoutMode>(currentLayout)
  const originalRef = useRef(currentLayout)

  const handleSelect = (id: LayoutMode) => {
    setSelected(id)
    setLayout(id)
  }

  return (
    <div className="px-6 pb-8">
      <SheetHeader
        title="Layout"
        theme={theme}
        onCancel={() => { setLayout(originalRef.current); onClose() }}
        onApply={onClose}
      />
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(LAYOUTS) as LayoutMode[]).map((id) => {
          const l = LAYOUTS[id]
          const isActive = selected === id
          return (
            <button
              key={id}
              className="rounded-xl p-4 text-center transition-all"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                border: CardBorder(isActive, theme.isDark),
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
              onClick={() => handleSelect(id)}
            >
              <div className="flex justify-center mb-2">
                <LayoutPreviewIcon layout={id} theme={theme} />
              </div>
              <p className="text-xs font-medium" style={{ color: theme.text }}>
                {l.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LayoutPreviewIcon({ layout, theme }: { layout: LayoutMode; theme: ThemeConfig }) {
  const color = theme.textMuted
  switch (layout) {
    case 'freeform':
      return (
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <rect x="3" y="5" width="8" height="6" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="14" y="2" width="8" height="6" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="7" y="16" width="8" height="6" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="20" y="12" width="8" height="6" rx="1" stroke={color} strokeWidth="1.2" />
        </svg>
      )
    case 'grid':
      return (
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="18" y="2" width="12" height="12" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="2" y="18" width="12" height="12" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="18" y="18" width="12" height="12" rx="1" stroke={color} strokeWidth="1.2" />
        </svg>
      )
    case 'radial':
      return (
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="0.8" strokeDasharray="2 2" />
          <rect x="12" y="3" width="8" height="5" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="22" y="13" width="8" height="5" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="12" y="24" width="8" height="5" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="2" y="13" width="8" height="5" rx="1" stroke={color} strokeWidth="1.2" />
        </svg>
      )
    case 'timeline':
      return (
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <line x1="2" y1="16" x2="30" y2="16" stroke={color} strokeWidth="0.8" strokeDasharray="2 2" />
          <rect x="2" y="11" width="7" height="10" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="12.5" y="11" width="7" height="10" rx="1" stroke={color} strokeWidth="1.2" />
          <rect x="23" y="11" width="7" height="10" rx="1" stroke={color} strokeWidth="1.2" />
        </svg>
      )
  }
}
