import { useState, useRef, useEffect, useCallback } from 'react'
import { useNoteStore } from '../store/useNoteStore'
import { getTheme, THEMES, CANVAS_TYPES, FONTS, LAYOUTS, type ThemeId, type CanvasType, type FontId, type LayoutMode, getFontFamily } from '../utils/customization'
import { useIsMobile } from '../hooks/useIsMobile'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const exportNotes = useNoteStore((s) => s.exportNotes)
  const importNotes = useNoteStore((s) => s.importNotes)
  const clearAllNotes = useNoteStore((s) => s.clearAllNotes)
  const setArchivePanelOpen = useNoteStore((s) => s.setArchivePanelOpen)
  const archivedCount = useNoteStore((s) => s.notes.filter((n) => n.archived).length)
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
  const isMobile = useIsMobile()

  // Customization actions
  const setTheme = useNoteStore((s) => s.setTheme)
  const setCanvasType = useNoteStore((s) => s.setCanvasType)
  const setFont = useNoteStore((s) => s.setFont)
  const setLayout = useNoteStore((s) => s.setLayout)
  const customization = useNoteStore((s) => s.customization.global)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowClearConfirm(false)
        setShowShortcuts(false)
        setShowCustomize(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = useCallback(() => {
    const json = exportNotes()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stikie-net-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }, [exportNotes])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        const success = importNotes(text)
        if (!success) alert('Invalid file format.')
      }
      reader.readAsText(file)
    }
    input.click()
    setOpen(false)
  }, [importNotes])

  const handleClear = useCallback(() => {
    clearAllNotes()
    setShowClearConfirm(false)
    setOpen(false)
  }, [clearAllNotes])

  const menuStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    background: theme.menuBg,
    backdropFilter: 'blur(12px)',
    boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)',
  }

  const textColor = theme.text
  const textMuted = theme.textMuted
  const borderColor = theme.menuBorder
  const kbdBg = theme.isDark ? 'bg-white/10' : 'bg-gray-100'

  return (
    <div ref={menuRef} className="relative flex items-center">
      <button
        onClick={() => { setOpen(!open); setShowShortcuts(false); setShowClearConfirm(false); setShowCustomize(false) }}
        className="p-2 rounded-lg transition-colors duration-150"
        title="Settings"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 rounded-lg p-1 z-50"
          style={{ ...menuStyle, width: showCustomize ? 280 : 224 }}
        >
          {showCustomize ? (
            <div className="p-3">
              <button
                onClick={() => setShowCustomize(false)}
                className="text-xs mb-3 flex items-center gap-1 transition-colors"
                style={{ color: textMuted }}
              >
                ← Back
              </button>
              <h3 className="text-sm font-semibold mb-3" style={{ color: textColor }}>Customize</h3>

              {/* Theme */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Theme</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                    <button
                      key={id}
                      className="rounded-lg p-1.5 text-center transition-all"
                      style={{
                        backgroundColor: THEMES[id].bg,
                        border: customization.theme === id
                          ? `2px solid ${theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                          : `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                      onClick={() => setTheme(id)}
                    >
                      <p className="text-[9px]" style={{ color: THEMES[id].text }}>{THEMES[id].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Canvas</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CANVAS_TYPES) as CanvasType[]).map((id) => (
                    <button
                      key={id}
                      className="rounded-lg p-1.5 text-center transition-all"
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        border: customization.canvas === id
                          ? `2px solid ${theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                          : `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                      onClick={() => setCanvasType(id)}
                    >
                      <p className="text-[9px]" style={{ color: textColor }}>{CANVAS_TYPES[id].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Font</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(FONTS) as FontId[]).map((id) => (
                    <button
                      key={id}
                      className="rounded-lg p-1.5 text-left transition-all"
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        border: customization.font === id
                          ? `2px solid ${theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                          : `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                      onClick={() => setFont(id)}
                    >
                      <p className="text-xs" style={{ fontFamily: getFontFamily(id), color: textColor }}>{FONTS[id].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout */}
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Layout</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(LAYOUTS) as LayoutMode[]).map((id) => (
                    <button
                      key={id}
                      className="rounded-lg p-1.5 text-center transition-all"
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        border: customization.layout === id
                          ? `2px solid ${theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'}`
                          : `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                      onClick={() => setLayout(id)}
                    >
                      <p className="text-[9px]" style={{ color: textColor }}>{LAYOUTS[id].label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : showShortcuts ? (
            <div className="p-3">
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-xs mb-2 flex items-center gap-1 transition-colors"
                style={{ color: textMuted }}
              >
                ← Back
              </button>
              <h3 className="text-sm font-semibold mb-2" style={{ color: textColor }}>Keyboard Shortcuts</h3>
              <div className="space-y-1.5 text-xs" style={{ color: textMuted }}>
                {[
                  ['Ctrl/⌘ + N', 'New note'],
                  ['Ctrl/⌘ + F', 'Search'],
                  ['Ctrl/⌘ + P', 'Pin / Unpin note'],
                  ['Escape', 'Close / Deselect'],
                  ['Delete', 'Archive note'],
                  ['Ctrl/⌘ + Z', 'Undo archive'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between">
                    <kbd className={`px-1.5 py-0.5 ${kbdBg} rounded text-[10px] font-mono`}>{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : showClearConfirm ? (
            <div className="p-3 text-center">
              <p className="text-sm mb-3" style={{ color: textColor }}>Delete all notes? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors"
                  style={{ color: textColor, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                  style={{ color: '#e0e0e0' }}
                >
                  Delete All
                </button>
              </div>
            </div>
          ) : (
            <>
              {isMobile && (
                <>
                  <SettingsMenuItem
                    label="Customize"
                    onClick={() => setShowCustomize(true)}
                    textColor={textColor}
                    hoverBg={theme.menuHoverBg}
                  />
                  <hr className="my-2" style={{ borderColor }} />
                </>
              )}
              <SettingsMenuItem
                label="Export as JSON"
                onClick={handleExport}
                textColor={textColor}
                hoverBg={theme.menuHoverBg}
              />
              <SettingsMenuItem
                label="Import from JSON"
                onClick={handleImport}
                textColor={textColor}
                hoverBg={theme.menuHoverBg}
              />
              <hr className="my-2" style={{ borderColor }} />
              <SettingsMenuItem
                label="Keyboard Shortcuts"
                onClick={() => setShowShortcuts(true)}
                textColor={textColor}
                hoverBg={theme.menuHoverBg}
              />
              <button
                onClick={() => { setArchivePanelOpen(true); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150 flex justify-between items-center"
                style={{ color: textColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span>View Archive</span>
                {archivedCount > 0 && (
                  <span className="text-xs" style={{ color: textMuted }}>{archivedCount}</span>
                )}
              </button>
              <hr className="my-2" style={{ borderColor }} />
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Clear All Notes
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SettingsMenuItem({ label, onClick, textColor, hoverBg }: { label: string; onClick: () => void; textColor: string; hoverBg: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150"
      style={{ color: textColor }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {label}
    </button>
  )
}
