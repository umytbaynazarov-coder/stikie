import { useNoteStore } from '../store/useNoteStore'
import SettingsMenu from './SettingsMenu'

export default function TopBar() {
  const darkMode = useNoteStore((s) => s.darkMode)
  const toggleDarkMode = useNoteStore((s) => s.toggleDarkMode)
  const setSearchOpen = useNoteStore((s) => s.setSearchOpen)
  const searchOpen = useNoteStore((s) => s.searchOpen)

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-3 z-40"
      style={{
        background: darkMode ? 'rgba(26,26,26,0.8)' : 'rgba(250,250,248,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Logo */}
      <img
        src="/logo.svg"
        alt="stikie"
        className="h-20 select-none"
        draggable={false}
      />

      {/* Right: Controls */}
      <div className="flex items-center gap-1" style={{ color: darkMode ? '#ccc' : '#666' }}>
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
          title="Search (Ctrl+F)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Settings */}
        <SettingsMenu />
      </div>
    </div>
  )
}
