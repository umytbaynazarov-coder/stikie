import { create } from 'zustand'
import { type Note, type NoteColor, NOTE_COLORS, generateId, getRandomRotation, getSmartPosition, migrateNote, MAX_PINNED_NOTES } from '../utils/helpers'
import {
  type ThemeId,
  type CanvasType,
  type FontId,
  type LayoutMode,
  type CustomizationStore,
  DEFAULT_SETTINGS,
  applyThemeToDOM,
  loadGoogleFonts,
  calculateGridLayout,
  calculateRadialLayout,
  calculateTimelineLayout,
  FONTS,
} from '../utils/customization'
import { getCurrentUserId } from '../lib/authRef'
import { upsertNote, deleteNoteFromSupabase, batchUpsertNotes } from '../lib/supabaseSync'
import { addToSyncQueue } from '../lib/syncQueue'

const STORAGE_KEY = 'stikie-net-notes'
const DARK_MODE_KEY = 'stikie-net-dark'
const CANVAS_KEY = 'stikie-net-canvas'
const CUSTOMIZATION_KEY = 'stikie-net-customization'

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

function loadCustomization(): CustomizationStore {
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CustomizationStore
      return {
        global: { ...DEFAULT_SETTINGS, ...parsed.global },
        boards: parsed.boards || {},
      }
    }
  } catch {
    // fall through
  }

  // Migrate from old dark mode setting
  try {
    const oldDark = localStorage.getItem(DARK_MODE_KEY)
    if (oldDark === 'true') {
      return {
        global: { ...DEFAULT_SETTINGS, theme: 'onyx' as ThemeId },
        boards: {},
      }
    }
  } catch {
    // fall through
  }

  return { global: { ...DEFAULT_SETTINGS }, boards: {} }
}

function saveCustomization(store: CustomizationStore) {
  localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(store))
}

function loadCanvas(): { x: number; y: number; zoom: number } {
  try {
    const raw = localStorage.getItem(CANVAS_KEY)
    return raw ? JSON.parse(raw) : { x: 0, y: 0, zoom: 1 }
  } catch {
    return { x: 0, y: 0, zoom: 1 }
  }
}

// ── Sync helpers ──────────────────────────────────────────────

const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {}

/** Sync a single note to Supabase (debounced for content updates). */
function debouncedSyncNote(noteId: string, delayMs: number) {
  const userId = getCurrentUserId()
  if (!userId) return
  if (syncTimers[noteId]) clearTimeout(syncTimers[noteId])
  syncTimers[noteId] = setTimeout(() => {
    const note = useNoteStore.getState().notes.find((n) => n.id === noteId)
    if (!note) return
    upsertNote(note, userId).catch(() => {
      addToSyncQueue({ type: 'upsert', noteId, data: note })
    })
  }, delayMs)
}

/** Sync a single note to Supabase immediately (fire-and-forget). */
function syncNoteNow(noteId: string) {
  const userId = getCurrentUserId()
  if (!userId) return
  const note = useNoteStore.getState().notes.find((n) => n.id === noteId)
  if (!note) return
  upsertNote(note, userId).catch(() => {
    addToSyncQueue({ type: 'upsert', noteId, data: note })
  })
}

/** Delete a note from Supabase (fire-and-forget). */
function syncDeleteNote(noteId: string) {
  const userId = getCurrentUserId()
  if (!userId) return
  deleteNoteFromSupabase(noteId).catch(() => {
    addToSyncQueue({ type: 'delete', noteId })
  })
}

/** Sync multiple notes to Supabase (fire-and-forget). */
function syncBatchNotes(noteIds: string[]) {
  const userId = getCurrentUserId()
  if (!userId || noteIds.length === 0) return
  const notes = useNoteStore.getState().notes.filter((n) => noteIds.includes(n.id))
  if (notes.length === 0) return
  batchUpsertNotes(notes, userId).catch(() => {
    for (const note of notes) {
      addToSyncQueue({ type: 'upsert', noteId: note.id, data: note })
    }
  })
}

// ── Store types ───────────────────────────────────────────────

interface DeletedNote {
  note: Note
  index: number
  type: 'archived' | 'deleted'
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

interface NoteStore {
  notes: Note[]
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

  // Auth UI
  authModalOpen: boolean

  // Sync
  syncStatus: SyncStatus

  // Customization
  customization: CustomizationStore

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
  setAuthModalOpen: (open: boolean) => void
  setSyncStatus: (status: SyncStatus) => void
  setNotesDirectly: (notes: Note[]) => void
  duplicateNote: (id: string) => string
  rearrangeNotes: () => void

  // Customization actions
  setTheme: (theme: ThemeId) => void
  setCanvasType: (canvas: CanvasType) => void
  setFont: (font: FontId) => void
  setLayout: (layout: LayoutMode) => void
}

export const useNoteStore = create<NoteStore>((set, get) => {
  const initial = loadCanvas()
  const initialCustomization = loadCustomization()

  // Apply initial theme to DOM
  applyThemeToDOM(initialCustomization.global.theme)

  // Load Google Fonts for all font options so they're available in preview
  const fontsToLoad = Object.keys(FONTS).filter((id) => FONTS[id as FontId].googleFont) as FontId[]
  loadGoogleFonts(fontsToLoad)

  // Clean up old dark mode key
  localStorage.removeItem(DARK_MODE_KEY)

  const initialNotes = loadNotes()
  const initialRotations: Record<string, number> = {}
  initialNotes.forEach((n) => {
    initialRotations[n.id] = getRandomRotation()
  })

  return {
    notes: initialNotes,
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
    authModalOpen: false,
    syncStatus: 'idle',
    customization: initialCustomization,

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
      syncNoteNow(id)
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
      // Debounce content updates, sync others immediately
      if ('content' in updates) {
        debouncedSyncNote(id, 500)
      } else {
        syncNoteNow(id)
      }
    },

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
      syncNoteNow(id)
    },

    undoDelete: () => {
      const { deletedStack } = get()
      if (deletedStack.length === 0) return null
      const last = deletedStack[deletedStack.length - 1]
      const type = last.type || 'deleted'

      if (type === 'archived') {
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
        syncNoteNow(last.note.id)
      } else {
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
        syncNoteNow(last.note.id)
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
      syncNoteNow(id)
    },

    moveNote: (id, x, y) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, x, y, updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      // Debounce move syncs to avoid flooding during drag
      debouncedSyncNote(id, 500)
    },

    resizeNote: (id, width, height) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, width: Math.max(150, width), height: Math.max(100, height), updatedAt: Date.now() } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      debouncedSyncNote(id, 500)
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
        // Sync all imported notes
        const userId = getCurrentUserId()
        if (userId) {
          batchUpsertNotes(migrated, userId).catch(() => {
            for (const note of migrated) {
              addToSyncQueue({ type: 'upsert', noteId: note.id, data: note })
            }
          })
        }
        return true
      } catch {
        return false
      }
    },

    clearAllNotes: () => {
      saveNotes([])
      set({ notes: [], rotations: {}, selectedNoteId: null, editingNoteId: null })
    },

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
      syncNoteNow(id)
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
      syncNoteNow(id)
    },

    restoreNote: (id) => {
      set((state) => {
        const newNotes = state.notes.map((n) =>
          n.id === id ? { ...n, archived: false, archivedAt: null } : n
        )
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      syncNoteNow(id)
    },

    permanentlyDelete: (id) => {
      set((state) => {
        const newNotes = state.notes.filter((n) => n.id !== id)
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      syncDeleteNote(id)
    },

    clearArchive: () => {
      const archivedIds = get().notes.filter((n) => n.archived).map((n) => n.id)
      set((state) => {
        const newNotes = state.notes.filter((n) => !n.archived)
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      const userId = getCurrentUserId()
      if (userId) {
        for (const noteId of archivedIds) {
          deleteNoteFromSupabase(noteId).catch(() => {
            addToSyncQueue({ type: 'delete', noteId })
          })
        }
      }
    },

    setArchivePanelOpen: (open) => set({ archivePanelOpen: open }),
    setPinLimitToast: (show) => set({ pinLimitToast: show }),
    setActiveColorFilters: (colors) => set({ activeColorFilters: colors }),
    setAuthModalOpen: (open) => set({ authModalOpen: open }),
    setSyncStatus: (status) => set({ syncStatus: status }),

    setNotesDirectly: (notes) => {
      saveNotes(notes)
      const rotations: Record<string, number> = {}
      notes.forEach((n) => { rotations[n.id] = getRandomRotation() })
      set({ notes, rotations, selectedNoteId: null, editingNoteId: null, deletedStack: [] })
    },

    duplicateNote: (id) => {
      const { notes, canvasX, canvasY, zoom } = get()
      const source = notes.find((n) => n.id === id)
      if (!source || source.archived) return ''
      const newId = generateId()
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
      syncNoteNow(newId)
      return newId
    },

    rearrangeNotes: () => {
      const { notes, canvasX, canvasY, zoom } = get()
      const active = notes.filter((n) => !n.archived && !n.pinned)
      if (active.length === 0) return

      const positions = calculateGridLayout(active.length, canvasX, canvasY, zoom)
      const activeIds = new Set(active.map((n) => n.id))
      let idx = 0

      set((state) => {
        const newNotes = state.notes.map((n) => {
          if (!activeIds.has(n.id)) return n
          const pos = positions[idx++]
          return { ...n, x: pos.x, y: pos.y, updatedAt: Date.now() }
        })
        saveNotes(newNotes)
        return { notes: newNotes }
      })
      syncBatchNotes(Array.from(activeIds))
    },

    // ── Customization Actions ──────────────────────────────────────

    setTheme: (theme) => {
      applyThemeToDOM(theme)
      set((state) => {
        const newCustomization: CustomizationStore = {
          ...state.customization,
          global: { ...state.customization.global, theme },
        }
        saveCustomization(newCustomization)
        return { customization: newCustomization }
      })
    },

    setCanvasType: (canvas) => {
      set((state) => {
        const newCustomization: CustomizationStore = {
          ...state.customization,
          global: { ...state.customization.global, canvas },
        }
        saveCustomization(newCustomization)
        return { customization: newCustomization }
      })
    },

    setFont: (font) => {
      set((state) => {
        const newCustomization: CustomizationStore = {
          ...state.customization,
          global: { ...state.customization.global, font },
        }
        saveCustomization(newCustomization)
        return { customization: newCustomization }
      })
    },

    setLayout: (layout) => {
      const { notes, canvasX, canvasY, zoom } = get()
      const active = notes.filter((n) => !n.archived && !n.pinned)

      // Apply layout arrangement (except freeform)
      if (layout !== 'freeform' && active.length > 0) {
        let positions: { x: number; y: number }[]

        switch (layout) {
          case 'grid':
            positions = calculateGridLayout(active.length, canvasX, canvasY, zoom)
            break
          case 'radial':
            positions = calculateRadialLayout(active.length, canvasX, canvasY, zoom)
            break
          case 'timeline':
            positions = calculateTimelineLayout(active.length, canvasX, canvasY, zoom)
            break
        }

        const activeIds = new Set(active.map((n) => n.id))
        let idx = 0

        set((state) => {
          const newNotes = state.notes.map((n) => {
            if (!activeIds.has(n.id)) return n
            const pos = positions[idx++]
            return { ...n, x: pos.x, y: pos.y, updatedAt: Date.now() }
          })
          saveNotes(newNotes)
          const newCustomization: CustomizationStore = {
            ...state.customization,
            global: { ...state.customization.global, layout },
          }
          saveCustomization(newCustomization)
          return { notes: newNotes, customization: newCustomization }
        })
        syncBatchNotes(Array.from(activeIds))
      } else {
        set((state) => {
          const newCustomization: CustomizationStore = {
            ...state.customization,
            global: { ...state.customization.global, layout },
          }
          saveCustomization(newCustomization)
          return { customization: newCustomization }
        })
      }
    },
  }
})
