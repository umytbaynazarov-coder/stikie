import type { Note } from '../utils/helpers'
import { upsertNote, deleteNoteFromSupabase } from './supabaseSync'

const QUEUE_KEY = 'stikie-sync-queue'

export interface QueueEntry {
  type: 'upsert' | 'delete'
  noteId: string
  data?: Note
  timestamp: number
}

export function addToSyncQueue(entry: Omit<QueueEntry, 'timestamp'>) {
  const queue = getQueue()
  // Replace existing entry for same noteId+type (last-write-wins)
  const filtered = queue.filter(
    (e) => !(e.noteId === entry.noteId && e.type === entry.type)
  )
  filtered.push({ ...entry, timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
}

export function getQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export async function processQueue(userId: string): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  const errors: QueueEntry[] = []

  // Process oldest first
  const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp)

  for (const entry of sorted) {
    try {
      if (entry.type === 'upsert' && entry.data) {
        await upsertNote(entry.data, userId)
      } else if (entry.type === 'delete') {
        await deleteNoteFromSupabase(entry.noteId)
      }
    } catch {
      errors.push(entry)
    }
  }

  if (errors.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(errors))
  } else {
    clearQueue()
  }
}
