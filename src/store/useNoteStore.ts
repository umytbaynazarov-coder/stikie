import { create } from 'zustand'
import { type Note, type NoteColor, NOTE_COLORS, generateId, getRandomRotation, getSmartPosition, migrateNote, MAX_PINNED_NOTES } from '../utils/helpers'

const STORAGE_KEY = 'stikie-net-notes'
const DARK_MODE_KEY = 'stikie-net-dark'
const CANVAS_KEY = 'stikie-net-canvas'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, unknown>[]
    return parsed.map(migrateNote)
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function loadCanvas(): { x: number; y: number; zoom: number } {
  try {
    const raw = localStorage.getItem(CANVAS_KEY)
    return raw ? JSON.parse(raw) : { x: 0, y: 0, zoom: 1 }
  } catch {
    return { x: 0, y: 0, zoom: 1 }
  }
}

interface DeletedNote {
  note: Note
  index: number
  type: 'archived' | 'deleted'
}

interface NoteStore {
  notes: Note[]
  darkMode: boolean
  canvasX: number
  canvasY: number
  zoom: number
  searchQuery: string
  searchOpen: boolean
  selectedNoteId: string | null
  editingNoteId: string | null
  deletedStack: DeletedNote[]
  rotations: Record<string, number>
  archivePanelOpen: boolean
  pinLimitToast: boolean
  activeColorFilters: NoteColor[]

  addNote: (x?: number, y?: number) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  undoDelete: () => Note | null
  cycleColor: (id: string) => void
  moveNote: (id: string, x: number, y: number) => void
  resizeNote: (id: string, width: number, height: number) => void
  setCanvas: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  setSelectedNote: (id: string | null) => void
  setEditingNote: (id: string | null) => void
  toggleDarkMode: () => void
  exportNotes: () => string
  importNotes: (json: string) => boolean
  clearAllNotes: () => void
  togglePin: (id: string) => void
  archiveNote: (id: string) => void
  restoreNote: (id: string) => void
  permanentlyDelete: (id: string) => void
  clearArchive: () => void
  setArchivePanelOpen: (open: boolean) => void
  setPinLimitToast: (show: boolean) => void
  setActiveColorFilters: (colors: NoteColor[]) => void
  duplicateNote: (id: string) => string
  rearrangeNotes: () => void
}

export const useNoteStore = create<NoteStore>((set, get) => {
  const initial = loadCanvas()
  const initialDark = loadDarkMode()
  if (initialDark) document.body.classList.add('dark')

  const initialNotes = loadNotes()
  const initialRotations: Record<string, number> = {}
  initialNotes.forEach((n) => {
    initialRotations[n.id] = getRandomRotation()
  })

  return {
    notes: initialNotes,
    darkMode: initialDark,
    canvasX: initial.x,
    canvasY: initial.y,
    zoom: initial.zoom,
    searchQuery: '',
    searchOpen: false,
    selectedNoteId: null,
    editingNoteId: null,
    deletedStack: [],
    rotations: initialRotations,
    archivePanelOpen: false,
    pinLimitToast: false,
    activeColorFilters: [],

    addNote: (x?: number, y?: number) => {
      const { notes, canvasX, canvasY, zoom } = get()
      const pos = x !== undefined && y !== undefined
        ? { x, y }
        : getSmartPosition(notes, canvasX, canvasY, zoom)
      const id = generateId()
      const note: Note = {
        id,
        content: '',
        color: 'yellow',
        x: pos.x,
        y: pos.y,
        width: 220,
        height: 180,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        archived: false,
        archivedAt: null,
      }
      set((state) => {
        const newNotes = [...state.notes, note]
        saveNotes(newNotes)
        return {
          notes: newNotes,
          selectedNoteId: id,
          editingNoteId: id,
          rotations: { ...state.rotations, [id]: getRandomRotation() },
        }
      })
      return id
    },

    updateNote: (id, updates) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    // deleteNote now archives instead of removing
    deleteNote: (id) => {
      set((state) => {
        const idx = state.notes.findIndex((n) => n.id === id)
        if (idx === -1) return state
        const note = state.notes[idx]
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, archived: true, archivedAt: Date.now(), pinned: false } : n
        )
        saveNotes(newNotes)
        return {
          notes: newNotes,
          deletedStack: [...state.deletedStack, { note, index: idx, type: 'archived' as const }],
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
          editingNoteId: state.editingNoteId === id ? null : state.editingNoteId,
        }
      })
    },

    undoDelete: () => {
      const { deletedStack } = get()
      if (deletedStack.length === 0) return null
      const last = deletedStack[deletedStack.length - 1]
      const type = last.type || 'deleted'

      if (type === 'archived') {
        // Restore from archive: un-archive the note
        set((state) => {
          const newNotes = state.notes.map((n) =>
            n.id === last.note.id ? { ...n, archived: false, archivedAt: null } : n
          )
          saveNotes(newNotes)
          return {
            notes: newNotes,
            deletedStack: state.deletedStack.slice(0, -1),
          }
        })
      } else {
        // Restore from permanent delete: splice back in
        set((state) => {
          const newNotes = [...state.notes]
          const insertIdx = Math.min(last.index, newNotes.length)
          newNotes.splice(insertIdx, 0, last.note)
          saveNotes(newNotes)
          return {
            notes: newNotes,
            deletedStack: state.deletedStack.slice(0, -1),
            rotations: { ...state.rotations, [last.note.id]: getRandomRotation() },
          }
        })
      }
      return last.note
    },

    cycleColor: (id) => {
      set((state) => {
        const note = state.notes.find((n) => n.id === id)
        if (!note) return state
        const currentIdx = NOTE_COLORS.indexOf(note.color)
        const nextColor = NOTE_COLORS[(currentIdx + 1) % NOTE_COLORS.length]
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, color: nextColor as NoteColor, updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    moveNote: (id, x, y) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, x, y, updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    resizeNote: (id, width, height) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, width: Math.max(150, width), height: Math.max(100, height), updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    setCanvas: (x, y) => {
      set({ canvasX: x, canvasY: y })
      localStorage.setItem(CANVAS_KEY, JSON.stringify({ x, y, zoom: get().zoom }))
    },

    setZoom: (zoom) => {
      const clamped = Math.min(2, Math.max(0.5, zoom))
      set({ zoom: clamped })
      localStorage.setItem(CANVAS_KEY, JSON.stringify({ x: get().canvasX, y: get().canvasY, zoom: clamped }))
    },

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSearchOpen: (open) => set({
      searchOpen: open,
      searchQuery: open ? get().searchQuery : '',
      activeColorFilters: open ? get().activeColorFilters : [],
    }),
    setSelectedNote: (id) => set({ selectedNoteId: id }),
    setEditingNote: (id) => set({ editingNoteId: id }),

    toggleDarkMode: () => {
      set((state) => {
        const newDark = !state.darkMode
        localStorage.setItem(DARK_MODE_KEY, String(newDark))
        if (newDark) {
          document.body.classList.add('dark')
        } else {
          document.body.classList.remove('dark')
        }
        return { darkMode: newDark }
      })
    },

    exportNotes: () => JSON.stringify(get().notes, null, 2),

    importNotes: (json) => {
      try {
        const parsed = JSON.parse(json) as Record<string, unknown>[]
        if (!Array.isArray(parsed)) return false
        const migrated = parsed.map(migrateNote)
        const rotations: Record<string, number> = {}
        migrated.forEach((n) => { rotations[n.id] = getRandomRotation() })
        saveNotes(migrated)
        set({ notes: migrated, rotations })
        return true
      } catch {
        return false
      }
    },

    clearAllNotes: () => {
      saveNotes([])
      set({ notes: [], rotations: {}, selectedNoteId: null, editingNoteId: null })
    },

    // Pin: converts coordinates between canvas-space and screen-space
    togglePin: (id) => {
      const { notes, canvasX, canvasY, zoom } = get()
      const note = notes.find((n) => n.id === id)
      if (!note || note.archived) return

      if (!note.pinned) {
        const pinnedCount = notes.filter((n) => n.pinned && !n.archived).length
        if (pinnedCount >= MAX_PINNED_NOTES) {
          set({ pinLimitToast: true })
          return
        }
        // Pinning: convert canvas-space to screen-space
        const screenX = note.x * zoom + canvasX
        const screenY = note.y * zoom + canvasY
        set((state) => {
          const newNotes = state.notes.map((n) =>
            n.id === id ? { ...n, pinned: true, x: screenX, y: screenY, updatedAt: Date.now() } : n
          )
          saveNotes(newNotes)
          return { notes: newNotes }
        })
      } else {
        // Unpinning: convert screen-space back to canvas-space
        const canvasSpaceX = (note.x - canvasX) / zoom
        const canvasSpaceY = (note.y - canvasY) / zoom
        set((state) => {
          const newNotes = state.notes.map((n) =>
            n.id === id ? { ...n, pinned: false, x: canvasSpaceX, y: canvasSpaceY, updatedAt: Date.now() } : n
          )
          saveNotes(newNotes)
          return { notes: newNotes }
        })
      }
    },

    archiveNote: (id) => {
      set((state) => {
        const idx = state.notes.findIndex((n) => n.id === id)
        if (idx === -1) return state
        const note = state.notes[idx]
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, archived: true, archivedAt: Date.now(), pinned: false } : n
        )
        saveNotes(newNotes)
        return {
          notes: newNotes,
          deletedStack: [...state.deletedStack, { note, index: idx, type: 'archived' as const }],
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
          editingNoteId: state.editingNoteId === id ? null : state.editingNoteId,
        }
      })
    },

    restoreNote: (id) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, archived: false, archivedAt: null } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    permanentlyDelete: (id) => {
      set((state) => {
        const newNotes = state.notes.filter((n) => n.id !== id)
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    clearArchive: () => {
      set((state) => {
        const newNotes = state.notes.filter((n) => !n.archived)
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },

    setArchivePanelOpen: (open) => set({ archivePanelOpen: open }),
    setPinLimitToast: (show) => set({ pinLimitToast: show }),
    setActiveColorFilters: (colors) => set({ activeColorFilters: colors }),

    duplicateNote: (id) => {
      const { notes, canvasX, canvasY, zoom } = get()
      const source = notes.find((n) => n.id === id)
      if (!source || source.archived) return ''
      const newId = generateId()
      // If source is pinned, convert screen-space → canvas-space for the duplicate
      const baseX = source.pinned ? (source.x - canvasX) / zoom : source.x
      const baseY = source.pinned ? (source.y - canvasY) / zoom : source.y
      const duplicate: Note = {
        ...source,
        id: newId,
        x: baseX + 30,
        y: baseY + 30,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      set((state) => {
        const newNotes = [...state.notes, duplicate]
        saveNotes(newNotes)
        return {
          notes: newNotes,
          selectedNoteId: newId,
          editingNoteId: null,
          rotations: { ...state.rotations, [newId]: getRandomRotation() },
        }
      })
      return newId
    },

    rearrangeNotes: () => {
      const { notes, canvasX, canvasY, zoom } = get()
      const active = notes.filter((n) => !n.archived && !n.pinned)
      if (active.length === 0) return

      const NOTE_W = 220
      const NOTE_H = 180
      const GAP = 30
      const cols = Math.max(1, Math.floor(Math.sqrt(active.length * 1.5)))
      const rows = Math.ceil(active.length / cols)
      const totalW = cols * NOTE_W + (cols - 1) * GAP
      const totalH = rows * NOTE_H + (rows - 1) * GAP

      const viewCenterX = (-canvasX + window.innerWidth / 2) / zoom
      const viewCenterY = (-canvasY + window.innerHeight / 2) / zoom
      const startX = viewCenterX - totalW / 2
      const startY = viewCenterY - totalH / 2

      const activeIds = new Set(active.map((n) => n.id))
      let idx = 0

      set((state) => {
        const newNotes = state.notes.map((n) => {
          if (!activeIds.has(n.id)) return n
          const col = idx % cols
          const row = Math.floor(idx / cols)
          idx++
          return {
            ...n,
            x: startX + col * (NOTE_W + GAP),
            y: startY + row * (NOTE_H + GAP),
            updatedAt: Date.now(),
          }
        })
        saveNotes(newNotes)
        return { notes: newNotes }
      })
    },
  }
})
