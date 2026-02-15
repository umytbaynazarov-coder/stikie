import { useState, useRef, useEffect } from 'react'
import { useNoteStore } from '../store/useNoteStore'
import { useAuth } from '../contexts/AuthContext'
import { getTheme } from '../utils/customization'
import { supabase } from '../lib/supabase'

type View = 'menu' | 'password' | 'delete'

export default function UserAvatar() {
  const { user, signOut, deleteAccount, updatePassword } = useAuth()
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
  const setAuthModalOpen = useNoteStore((s) => s.setAuthModalOpen)

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const menuRef = useRef<HTMLDivElement>(null)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  // Delete form
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function closeMenu() {
    setOpen(false)
    setView('menu')
    resetPasswordForm()
    resetDeleteForm()
  }

  function resetPasswordForm() {
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setPwError('')
    setPwLoading(false)
    setPwSuccess(false)
  }

  function resetDeleteForm() {
    setDeleteInput('')
    setDeleteLoading(false)
    setDeleteError('')
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPw !== confirmPw) {
      setPwError('Passwords do not match')
      return
    }
    if (newPw.length < 6) {
      setPwError('Password must be at least 6 characters')
      return
    }

    setPwLoading(true)

    // Verify current password
    if (supabase && user?.email) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      })
      if (verifyErr) {
        setPwError('Current password is incorrect')
        setPwLoading(false)
        return
      }
    }

    const { error } = await updatePassword(newPw)
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setTimeout(() => { setView('menu'); resetPasswordForm() }, 1500)
    }
    setPwLoading(false)
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError('')
    const result = await deleteAccount()
    if (result?.error) {
      setDeleteError(result.error instanceof Error ? result.error.message : String(result.error))
      setDeleteLoading(false)
    } else {
      closeMenu()
    }
  }

  async function handleSignOut() {
    await signOut()
    closeMenu()
  }

  const isEmailUser = user?.app_metadata?.provider === 'email'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const userEmail = user?.email ?? ''
  const initial = userEmail.charAt(0).toUpperCase()

  const menuStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    background: theme.menuBg,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)',
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: theme.text,
    background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${theme.menuBorder}`,
    borderRadius: 8,
    padding: '6px 10px',
    width: '100%',
    outline: 'none',
  }

  // Not signed in — show sign-in button
  if (!user) {
    return (
      <button
        onClick={() => setAuthModalOpen(true)}
        className="flex items-center justify-center transition-colors duration-150"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          color: theme.textMuted,
        }}
        title="Sign In"
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    )
  }

  // Signed in — show avatar + dropdown
  return (
    <div ref={menuRef} className="relative flex items-center">
      <button
        onClick={() => { setOpen(!open); setView('menu') }}
        className="flex items-center justify-center overflow-hidden transition-colors duration-150"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: avatarUrl ? 'transparent' : theme.fabBg,
          color: avatarUrl ? undefined : theme.fabColor,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
        }}
        title={userEmail}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 rounded-lg p-1 z-50"
          style={{ ...menuStyle, width: view === 'menu' ? 224 : 260 }}
        >
          {view === 'password' ? (
            /* Manage Password */
            <div className="p-3">
              <button
                onClick={() => { setView('menu'); resetPasswordForm() }}
                className="text-xs mb-2 flex items-center gap-1 transition-colors"
                style={{ color: theme.textMuted }}
              >
                &larr; Back
              </button>
              <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Update Password</h3>
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  style={inputStyle}
                  required
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  style={inputStyle}
                  required
                  minLength={6}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  style={inputStyle}
                  required
                  minLength={6}
                />
                {pwError && <p className="text-xs" style={{ color: '#ef4444' }}>{pwError}</p>}
                {pwSuccess && <p className="text-xs" style={{ color: '#22c55e' }}>Password updated!</p>}
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => { setView('menu'); resetPasswordForm() }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                    style={{ color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                    style={{
                      color: theme.fabColor,
                      background: theme.fabBg,
                      opacity: pwLoading ? 0.6 : 1,
                      cursor: pwLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {pwLoading ? '...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          ) : view === 'delete' ? (
            /* Delete Account Confirmation */
            <div className="p-3">
              <button
                onClick={() => { setView('menu'); resetDeleteForm() }}
                className="text-xs mb-2 flex items-center gap-1 transition-colors"
                style={{ color: theme.textMuted }}
              >
                &larr; Back
              </button>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>Delete Account</h3>
              <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
                This will permanently delete your account and all your notes. This cannot be undone.
              </p>
              <p className="text-xs mb-2" style={{ color: theme.text }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                style={inputStyle}
                placeholder="DELETE"
              />
              {deleteError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{deleteError}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setView('menu'); resetDeleteForm() }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteInput !== 'DELETE' || deleteLoading}
                  onClick={handleDeleteAccount}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    color: '#fff',
                    background: deleteInput === 'DELETE' ? '#ef4444' : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    opacity: deleteInput !== 'DELETE' || deleteLoading ? 0.5 : 1,
                    cursor: deleteInput !== 'DELETE' || deleteLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleteLoading ? '...' : 'Delete Account'}
                </button>
              </div>
            </div>
          ) : (
            /* Default Menu */
            <>
              {/* Email display */}
              <div className="px-3 py-2 text-xs truncate" style={{ color: theme.textMuted }}>
                {userEmail}
              </div>
              <hr className="my-1" style={{ borderColor: theme.menuBorder }} />

              {isEmailUser && (
                <>
                  <button
                    onClick={() => setView('password')}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150"
                    style={{ color: theme.text }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    Manage Password
                  </button>
                  <hr className="my-1" style={{ borderColor: theme.menuBorder }} />
                </>
              )}

              <button
                onClick={() => setView('delete')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Delete Account
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-150"
                style={{ color: theme.text }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
