import { supabase } from './supabase'
import type { Note, NoteColor } from '../utils/helpers'

// ── Supabase row type (snake_case) ──────────────────────────

interface SupabaseNote {
  id: string
  user_id: string
  content: string
  color: string
  x: number
  y: number
  width: number
  height: number
  pinned: boolean
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ── Type mapping ────────────────────────────────────────────

function toSupabaseNote(note: Note, userId: string): SupabaseNote {
  return {
    id: note.id,
    user_id: userId,
    content: note.content,
    color: note.color,
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
    pinned: note.pinned,
    archived: note.archived,
    archived_at: note.archivedAt ? new Date(note.archivedAt).toISOString() : null,
    created_at: new Date(note.createdAt).toISOString(),
    updated_at: new Date(note.updatedAt).toISOString(),
  }
}

function fromSupabaseNote(row: SupabaseNote): Note {
  return {
    id: row.id,
    content: row.content,
    color: row.color as NoteColor,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    pinned: row.pinned,
    archived: row.archived,
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

// ── CRUD operations ─────────────────────────────────────────

export async function fetchAllNotes(userId: string): Promise<Note[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as SupabaseNote[]).map(fromSupabaseNote)
}

export async function upsertNote(note: Note, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('notes')
    .upsert(toSupabaseNote(note, userId), { onConflict: 'id' })
  if (error) throw error
}

export async function deleteNoteFromSupabase(noteId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
  if (error) throw error
}

export async function batchUpsertNotes(notes: Note[], userId: string): Promise<void> {
  if (!supabase || notes.length === 0) return
  // Chunk in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50
  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const chunk = notes.slice(i, i + BATCH_SIZE)
    const rows = chunk.map((n) => toSupabaseNote(n, userId))
    const { error } = await supabase
      .from('notes')
      .upsert(rows, { onConflict: 'id' })
    if (error) throw error
  }
}

export async function deleteAllUserNotes(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}
