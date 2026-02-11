import { useState, useRef, useEffect, useCallback } from 'react'
import { useNoteStore } from '../store/useNoteStore'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const exportNotes = useNoteStore((s) => s.exportNotes)
  const importNotes = useNoteStore((s) => s.importNotes)
  const clearAllNotes = useNoteStore((s) => s.clearAllNotes)
  const setArchivePanelOpen = useNoteStore((s) => s.setArchivePanelOpen)
  const archivedCount = useNoteStore((s) => s.notes.filter((n) => n.archived).length)
  const darkMode = useNoteStore((s) => s.darkMode)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowClearConfirm(false)
        setShowShortcuts(false)
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
    background: darkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)',
  }

  const textColor = darkMode ? '#e0e0e0' : '#555'
  const textMuted = darkMode ? '#999' : '#888'
  const hoverBg = darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const kbdBg = darkMode ? 'bg-white/10' : 'bg-gray-100'

  return (
    <div ref={menuRef} className="relative flex items-center">
      <button
        onClick={() => { setOpen(!open); setShowShortcuts(false); setShowClearConfirm(false) }}
        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
        title="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-56 rounded-lg p-1 z-50"
          style={menuStyle}
        >
          {showShortcuts ? (
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
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'}`}
                  style={{ color: textColor }}
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
              <button
                onClick={handleExport}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${hoverBg} transition-colors duration-150`}
                style={{ color: textColor }}
              >
                Export as JSON
              </button>
              <button
                onClick={handleImport}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${hoverBg} transition-colors duration-150`}
                style={{ color: textColor }}
              >
                Import from JSON
              </button>
              <hr className="my-2" style={{ borderColor }} />
              <button
                onClick={() => setShowShortcuts(true)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${hoverBg} transition-colors duration-150`}
                style={{ color: textColor }}
              >
                Keyboard Shortcuts
              </button>
              <button
                onClick={() => { setArchivePanelOpen(true); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg ${hoverBg} transition-colors duration-150 flex justify-between items-center`}
                style={{ color: textColor }}
              >
                <span>View Archive</span>
                {archivedCount > 0 && (
                  <span className="text-xs" style={{ color: textMuted }}>{archivedCount}</span>
                )}
              </button>
              <hr className="my-2" style={{ borderColor }} />
              <button
                onClick={() => setShowClearConfirm(true)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                style={{ color: '#ef4444' }}
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
