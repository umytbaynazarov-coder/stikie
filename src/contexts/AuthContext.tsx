import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useAuthProvider } from '../hooks/useAuth'
import { setCurrentUserId } from '../lib/authRef'
import { fetchAllNotes, batchUpsertNotes } from '../lib/supabaseSync'
import { processQueue, clearQueue } from '../lib/syncQueue'
import { useNoteStore } from '../store/useNoteStore'
import { isUUID } from '../utils/helpers'

type AuthContextType = ReturnType<typeof useAuthProvider>

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider()
  const hasSynced = useRef(false)

  // Keep the module-level ref in sync so the Zustand store can access userId
  useEffect(() => {
    setCurrentUserId(auth.user?.id ?? null)
  }, [auth.user])

  // Sign-in migration: merge localStorage notes with Supabase
  useEffect(() => {
    if (!auth.user || auth.loading || hasSynced.current) return
    hasSynced.current = true

    const userId = auth.user.id

    async function syncOnSignIn() {
      const store = useNoteStore.getState()
      const localNotes = [...store.notes]

      try {
        // Fetch remote notes
        const remoteNotes = await fetchAllNotes(userId)
        const remoteIds = new Set(remoteNotes.map((n) => n.id))

        // Migrate local note IDs to UUIDs if needed, and find local-only notes
        const localOnlyNotes = []
        for (const note of localNotes) {
          // Generate UUID for old-format IDs
          const migratedNote = isUUID(note.id)
            ? note
            : { ...note, id: crypto.randomUUID() }

          // Only upload notes not already in remote
          if (!remoteIds.has(migratedNote.id)) {
            localOnlyNotes.push(migratedNote)
          }
        }

        // Upload local-only notes to Supabase
        if (localOnlyNotes.length > 0) {
          await batchUpsertNotes(localOnlyNotes, userId)
        }

        // Merged set: remote + local-only
        const merged = [...remoteNotes, ...localOnlyNotes]

        // Update store with merged notes (no sync triggered)
        useNoteStore.getState().setNotesDirectly(merged)
      } catch {
        // If sync fails, keep using local notes — they'll sync later
      }

      // Process any pending sync queue
      if (navigator.onLine) {
        processQueue(userId).catch(() => {})
      }
    }

    syncOnSignIn()
  }, [auth.user, auth.loading])

  // Sign-out: clear local note cache
  useEffect(() => {
    if (!auth.loading && !auth.user && hasSynced.current) {
      // User just signed out — clear note cache
      useNoteStore.getState().clearAllNotes()
      clearQueue()
      hasSynced.current = false
    }
  }, [auth.user, auth.loading])

  // Online/offline handling
  useEffect(() => {
    function handleOnline() {
      const userId = auth.user?.id
      if (userId) {
        useNoteStore.getState().setSyncStatus('idle')
        processQueue(userId).catch(() => {})
      }
    }

    function handleOffline() {
      if (auth.user) {
        useNoteStore.getState().setSyncStatus('offline')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial offline status
    if (!navigator.onLine && auth.user) {
      useNoteStore.getState().setSyncStatus('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [auth.user])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
