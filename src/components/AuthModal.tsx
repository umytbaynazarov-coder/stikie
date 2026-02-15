import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNoteStore } from '../store/useNoteStore'
import { useAuth } from '../contexts/AuthContext'
import { getTheme } from '../utils/customization'

type Mode = 'signin' | 'signup' | 'forgot'

export default function AuthModal() {
  const open = useNoteStore((s) => s.authModalOpen)
  const setOpen = useNoteStore((s) => s.setAuthModalOpen)
  const themeId = useNoteStore((s) => s.customization.global.theme)
  const theme = getTheme(themeId)
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  function reset() {
    setEmail('')
    setPassword('')
    setError('')
    setLoading(false)
    setResetSent(false)
  }

  function handleClose() {
    setOpen(false)
    reset()
    setMode('signin')
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signin') {
      const result = await signInWithEmail(email, password)
      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else {
        handleClose()
      }
    } else if (mode === 'signup') {
      const result = await signUpWithEmail(email, password)
      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else {
        handleClose()
      }
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await resetPassword(email)
    if (result.error) {
      setError(result.error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError('')
    const result = await signInWithGoogle()
    if (result.error) {
      setError(result.error instanceof Error ? result.error.message : String(result.error))
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: theme.text,
    background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${theme.menuBorder}`,
    borderRadius: 8,
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
  }

  const primaryBtnStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: theme.fabColor,
    background: theme.fabBg,
    borderRadius: 8,
    padding: '8px 16px',
    width: '100%',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-sm mx-4 rounded-xl p-6"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: theme.menuBg,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${theme.menuBorder}`,
              boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {mode === 'forgot' ? (
              /* Forgot Password View */
              <div>
                <h2 className="text-base font-semibold mb-1" style={{ color: theme.text }}>
                  Reset Password
                </h2>
                <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                  We'll send you a link to reset your password.
                </p>

                {resetSent ? (
                  <div>
                    <p className="text-sm mb-4" style={{ color: theme.text }}>
                      Check your email for a reset link.
                    </p>
                    <button
                      onClick={() => { setMode('signin'); reset() }}
                      className="text-xs"
                      style={{ color: theme.textMuted }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword}>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                      required
                    />
                    <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, marginTop: 12 }}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); reset() }}
                      className="text-xs mt-3 block"
                      style={{ color: theme.textMuted }}
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Sign In / Sign Up View */
              <div>
                {/* Tabs */}
                <div className="flex gap-4 mb-5" style={{ borderBottom: `1px solid ${theme.menuBorder}` }}>
                  <button
                    onClick={() => { setMode('signin'); reset() }}
                    className="pb-2 text-sm font-medium"
                    style={{
                      color: mode === 'signin' ? theme.text : theme.textMuted,
                      borderBottom: mode === 'signin' ? `2px solid ${theme.text}` : '2px solid transparent',
                      marginBottom: -1,
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMode('signup'); reset() }}
                    className="pb-2 text-sm font-medium"
                    style={{
                      color: mode === 'signup' ? theme.text : theme.textMuted,
                      borderBottom: mode === 'signup' ? `2px solid ${theme.text}` : '2px solid transparent',
                      marginBottom: -1,
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Google OAuth */}
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
                  style={{
                    color: theme.text,
                    border: `1px solid ${theme.menuBorder}`,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.menuHoverBg }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: theme.menuBorder }} />
                  <span className="text-xs" style={{ color: theme.textMuted }}>or</span>
                  <div className="flex-1 h-px" style={{ background: theme.menuBorder }} />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    required
                    minLength={6}
                  />
                  <button type="submit" disabled={loading} style={primaryBtnStyle}>
                    {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                </form>

                {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}

                {mode === 'signin' && (
                  <button
                    onClick={() => { setMode('forgot'); reset() }}
                    className="text-xs mt-3 block"
                    style={{ color: theme.textMuted }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
