import { useNoteStore } from '../store/useNoteStore'
import { getTheme } from '../utils/customization'
import SettingsMenu from './SettingsMenu'
import UserAvatar from './UserAvatar'

export default function TopBar() {
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
  const setSearchOpen = useNoteStore((s) => s.setSearchOpen)
  const searchOpen = useNoteStore((s) => s.searchOpen)

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-3 z-40"
      style={{
        background: theme.topBarBg,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Logo */}
      <h2 className="text-lg font-bold" style={{ color: theme.text, paddingLeft: '12px' }}>Stikie</h2>

      {/* Right: Controls */}
      <div className="flex items-center gap-1" style={{ color: theme.textMuted }}>
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg transition-colors duration-150"
          style={{ color: theme.textMuted }}
          title="Search (Ctrl+F)"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Settings */}
        <SettingsMenu />
        <UserAvatar />
      </div>
    </div>
  )
}
