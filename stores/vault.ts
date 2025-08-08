import { defineStore } from 'pinia'

export const useVaultStore = defineStore('vault', {
  state: () => ({
    notes: [],
    folders: [],
    selectedNote: null,
    searchQuery: '',
    isLoading: false
  }),
  
  actions: {
    async loadVault() {
      this.isLoading = true
      try {
        // TODO: Load from local storage or API
        this.notes = [
          { id: 1, title: 'Welcome Note', content: '# Welcome\n\nThis is your first note!', created: new Date(), updated: new Date() }
        ]
      } finally {
        this.isLoading = false
      }
    },
    
    createNote(note) {
      const newNote = {
        id: Date.now(),
        created: new Date(),
        updated: new Date(),
        ...note
      }
      this.notes.push(newNote)
      return newNote
    },
    
    updateNote(id, updates) {
      const note = this.notes.find(n => n.id === id)
      if (note) {
        Object.assign(note, updates, { updated: new Date() })
      }
    },
    
    deleteNote(id) {
      const index = this.notes.findIndex(n => n.id === id)
      if (index > -1) {
        this.notes.splice(index, 1)
      }
    },
    
    searchNotes(query) {
      this.searchQuery = query
      return this.notes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      )
    }
  }
})