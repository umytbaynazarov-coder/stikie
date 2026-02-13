export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'] as const
export type NoteColor = (typeof NOTE_COLORS)[number]

export interface Note {
  id: string
  content: string
  color: NoteColor
  x: number
  y: number
  width: number
  height: number
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
  archivedAt: number | null
}

export const MAX_PINNED_NOTES = 5

/** Fill in default values for fields missing from old localStorage data */
export function migrateNote(raw: Record<string, unknown>): Note {
  return {
    id: (raw.id as string) ?? generateId(),
    content: (raw.content as string) ?? '',
    color: (raw.color as NoteColor) ?? 'yellow',
    x: (raw.x as number) ?? 0,
    y: (raw.y as number) ?? 0,
    width: (raw.width as number) ?? 220,
    height: (raw.height as number) ?? 180,
    createdAt: (raw.createdAt as number) ?? Date.now(),
    updatedAt: (raw.updatedAt as number) ?? Date.now(),
    pinned: (raw.pinned as boolean) ?? false,
    archived: (raw.archived as boolean) ?? false,
    archivedAt: (raw.archivedAt as number | null) ?? null,
  }
}


export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export function getRandomRotation(): number {
  return (Math.random() - 0.5) * 6 // -3 to +3 degrees
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getSmartPosition(notes: Note[], viewportX: number, viewportY: number, zoom: number): { x: number; y: number } {
  const centerX = (-viewportX + window.innerWidth / 2) / zoom
  const centerY = (-viewportY + window.innerHeight / 2) / zoom

  if (notes.length === 0) {
    return { x: centerX - 100, y: centerY - 75 }
  }

  const lastNote = notes[notes.length - 1]
  let newX = lastNote.x + 30
  let newY = lastNote.y + 30

  const hasOverlap = notes.some(
    (n) => Math.abs(n.x - newX) < 20 && Math.abs(n.y - newY) < 20
  )

  if (hasOverlap) {
    newX = centerX - 100 + (Math.random() - 0.5) * 200
    newY = centerY - 75 + (Math.random() - 0.5) * 200
  }

  return { x: newX, y: newY }
}
