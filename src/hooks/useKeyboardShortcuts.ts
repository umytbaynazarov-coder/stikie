import { useEffect } from 'react'
import { useNoteStore } from '../store/useNoteStore'

export function useKeyboardShortcuts() {
  const addNote = useNoteStore((s) => s.addNote)
  const deleteNote = useNoteStore((s) => s.deleteNote)
  const undoDelete = useNoteStore((s) => s.undoDelete)
  const togglePin = useNoteStore((s) => s.togglePin)
  const setSearchOpen = useNoteStore((s) => s.setSearchOpen)
  const searchOpen = useNoteStore((s) => s.searchOpen)
  const selectedNoteId = useNoteStore((s) => s.selectedNoteId)
  const editingNoteId = useNoteStore((s) => s.editingNoteId)
  const setSelectedNote = useNoteStore((s) => s.setSelectedNote)
  const setEditingNote = useNoteStore((s) => s.setEditingNote)
  const archivePanelOpen = useNoteStore((s) => s.archivePanelOpen)
  const setArchivePanelOpen = useNoteStore((s) => s.setArchivePanelOpen)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + N: New note
      if (mod && e.key === 'n') {
        e.preventDefault()
        addNote()
        return
      }

      // Ctrl/Cmd + F: Search
      if (mod && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
        return
      }

      // Ctrl/Cmd + P: Toggle pin on selected note
      if (mod && e.key === 'p') {
        e.preventDefault()
        if (selectedNoteId) {
          togglePin(selectedNoteId)
        }
        return
      }

      // Ctrl/Cmd + Z: Undo delete
      if (mod && e.key === 'z' && !e.shiftKey) {
        // Only intercept if we have deleted notes to undo
        const store = useNoteStore.getState()
        if (store.deletedStack.length > 0) {
          e.preventDefault()
          undoDelete()
          return
        }
      }

      // Escape: Close archive panel, search, or deselect
      if (e.key === 'Escape') {
        if (archivePanelOpen) {
          setArchivePanelOpen(false)
        } else if (searchOpen) {
          setSearchOpen(false)
        } else if (editingNoteId) {
          setEditingNote(null)
        } else if (selectedNoteId) {
          setSelectedNote(null)
        }
        return
      }

      // Delete/Backspace when note selected but not editing
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteId && !editingNoteId) {
        e.preventDefault()
        deleteNote(selectedNoteId)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addNote, deleteNote, undoDelete, togglePin, setSearchOpen, searchOpen, selectedNoteId, editingNoteId, setSelectedNote, setEditingNote, archivePanelOpen, setArchivePanelOpen])
}
