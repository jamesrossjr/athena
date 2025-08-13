<template>
  <div class="calendar-page">
    <div class="calendar-header">
      <input 
        v-model="localTitle" 
        @blur="updateTitle"
        class="calendar-title"
        placeholder="Untitled Calendar"
      />
      <div class="calendar-meta">
        <span class="page-type">📅 Calendar</span>
        <span class="event-count">{{ events.length }} events</span>
      </div>
    </div>

    <div class="calendar-toolbar">
      <div class="view-controls">
        <button 
          v-for="view in views" 
          :key="view"
          @click="currentView = view"
          class="view-button"
          :class="{ active: currentView === view }"
        >
          {{ view }}
        </button>
      </div>
      
      <div class="nav-controls">
        <button @click="previousPeriod" class="nav-button">‹</button>
        <h3 class="current-period">{{ formatCurrentPeriod() }}</h3>
        <button @click="nextPeriod" class="nav-button">›</button>
        <button @click="goToToday" class="today-button">Today</button>
      </div>
    </div>

    <div class="calendar-content">
      <!-- Month View -->
      <div v-if="currentView === 'Month'" class="month-view">
        <div class="weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">
            {{ day }}
          </div>
        </div>
        
        <div class="month-grid">
          <div 
            v-for="date in monthDates" 
            :key="date.toISOString()"
            class="month-day"
            :class="{ 
              'other-month': !isSameMonth(date, currentDate),
              'today': isToday(date)
            }"
            @click="selectDate(date)"
          >
            <div class="day-number">{{ date.getDate() }}</div>
            <div class="day-events">
              <div 
                v-for="event in getDateEvents(date)" 
                :key="event.id"
                class="event-chip"
                @click.stop="editEvent(event)"
              >
                {{ event.content.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Week View -->
      <div v-else-if="currentView === 'Week'" class="week-view">
        <div class="week-header">
          <div v-for="date in weekDates" :key="date.toISOString()" class="week-day-header">
            <div class="day-name">{{ formatDayName(date) }}</div>
            <div class="day-date" :class="{ today: isToday(date) }">{{ date.getDate() }}</div>
          </div>
        </div>
        
        <div class="week-content">
          <div class="time-column">
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ formatHour(hour - 1) }}
            </div>
          </div>
          
          <div v-for="date in weekDates" :key="date.toISOString()" class="week-day-column">
            <div 
              v-for="hour in 24" 
              :key="hour"
              class="time-cell"
              @click="createEventAt(date, hour - 1)"
            >
              <div 
                v-for="event in getHourEvents(date, hour - 1)" 
                :key="event.id"
                class="week-event"
                @click.stop="editEvent(event)"
              >
                {{ event.content.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Day View -->
      <div v-else class="day-view">
        <div class="day-header">
          <h2>{{ formatDate(currentDate) }}</h2>
        </div>
        
        <div class="day-content">
          <div class="time-column">
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ formatHour(hour - 1) }}
            </div>
          </div>
          
          <div class="day-column">
            <div 
              v-for="hour in 24" 
              :key="hour"
              class="time-cell"
              @click="createEventAt(currentDate, hour - 1)"
            >
              <div 
                v-for="event in getHourEvents(currentDate, hour - 1)" 
                :key="event.id"
                class="day-event"
                @click.stop="editEvent(event)"
              >
                <div class="event-title">{{ event.content.title }}</div>
                <div class="event-time">{{ formatEventTime(event) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Event Button -->
    <button @click="showEventModal = true" class="add-event-fab">
      <Icon name="i-heroicons-plus" class="plus-icon" />
    </button>
    
    <!-- Event Modal -->
    <div v-if="showEventModal" class="event-modal-overlay" @click.self="closeEventModal">
      <div class="event-modal">
        <h3>{{ editingEvent ? 'Edit Event' : 'New Event' }}</h3>
        
        <div class="form-group">
          <label>Title:</label>
          <input v-model="eventForm.title" type="text" placeholder="Event title" />
        </div>
        
        <div class="form-group">
          <label>Date:</label>
          <input v-model="eventForm.date" type="date" />
        </div>
        
        <div class="form-group">
          <label>Start Time:</label>
          <input v-model="eventForm.startTime" type="time" />
        </div>
        
        <div class="form-group">
          <label>End Time:</label>
          <input v-model="eventForm.endTime" type="time" />
        </div>
        
        <div class="modal-actions">
          <button @click="closeEventModal" class="btn-secondary">Cancel</button>
          <button @click="saveEvent" class="btn-primary">
            {{ editingEvent ? 'Update' : 'Create' }}
          </button>
          <button v-if="editingEvent" @click="deleteEvent" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PageWithRelations, Block } from '~/types/unified-data-layer'

interface Props {
  page: PageWithRelations
}

interface Emits {
  update: [page: PageWithRelations]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localTitle = ref(props.page.title)
const currentView = ref('Month')
const currentDate = ref(new Date())
const blocks = ref<Block[]>(props.page.blocks || [])
const showEventModal = ref(false)
const editingEvent = ref<Block | null>(null)

const views = ['Month', 'Week', 'Day']
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const eventForm = ref({
  title: '',
  date: '',
  startTime: '',
  endTime: ''
})

const events = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_ROW' && block.content.type === 'event')
)

const monthDates = computed(() => {
  const start = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  const startDay = start.getDay()
  const daysInMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0).getDate()
  
  const dates = []
  
  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(start)
    date.setDate(date.getDate() - i - 1)
    dates.push(date)
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), i))
  }
  
  // Next month days
  const remaining = 42 - dates.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, i)
    dates.push(date)
  }
  
  return dates
})

const weekDates = computed(() => {
  const start = new Date(currentDate.value)
  start.setDate(start.getDate() - start.getDay())
  
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }
  return dates
})

const formatCurrentPeriod = () => {
  if (currentView.value === 'Month') {
    return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (currentView.value === 'Week') {
    const start = weekDates.value[0]
    const end = weekDates.value[6]
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  } else {
    return currentDate.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
}

const isSameMonth = (date: Date, reference: Date) => {
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear()
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getDateEvents = (date: Date) => {
  return events.value.filter(event => {
    const eventDate = new Date(event.content.date)
    return eventDate.toDateString() === date.toDateString()
  })
}

const getHourEvents = (date: Date, hour: number) => {
  return getDateEvents(date).filter(event => {
    const startHour = parseInt(event.content.startTime?.split(':')[0] || '0')
    return startHour === hour
  })
}

// Placeholder implementations for all the calendar methods...
const updateTitle = async () => { /* ... */ }
const previousPeriod = () => { currentDate.value.setMonth(currentDate.value.getMonth() - 1) }
const nextPeriod = () => { currentDate.value.setMonth(currentDate.value.getMonth() + 1) }
const goToToday = () => { currentDate.value = new Date() }
const selectDate = (date: Date) => { currentDate.value = date }
const editEvent = (event: Block) => { editingEvent.value = event; showEventModal.value = true }
const createEventAt = (date: Date, hour: number) => { /* ... */ }
const closeEventModal = () => { showEventModal.value = false; editingEvent.value = null }
const saveEvent = async () => { /* ... */ }
const deleteEvent = async () => { /* ... */ }
const formatDate = (date: Date) => date.toLocaleDateString()
const formatDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' })
const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`
const formatEventTime = (event: Block) => `${event.content.startTime} - ${event.content.endTime}`

watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) blocks.value = [...newBlocks]
}, { immediate: true })
</script>

<style scoped>
.calendar-page { height: 100%; display: flex; flex-direction: column; background: var(--theme-bg-primary); }
.calendar-header { padding: 2rem 2rem 1rem; }
.calendar-title { font-size: 2rem; font-weight: 700; background: transparent; border: none; outline: none; margin-bottom: 0.5rem; width: 100%; }
.calendar-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: var(--theme-text-secondary); }
.calendar-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0 2rem 1rem; }
.view-controls { display: flex; gap: 0.25rem; background: var(--theme-hover); border-radius: 0.5rem; padding: 0.25rem; }
.view-button { padding: 0.5rem 1rem; border: none; background: transparent; border-radius: 0.25rem; cursor: pointer; }
.view-button.active { background: var(--theme-accent); color: white; }
.nav-controls { display: flex; align-items: center; gap: 1rem; }
.nav-button { padding: 0.5rem; border: 1px solid var(--theme-border); background: var(--theme-surface); border-radius: 0.25rem; cursor: pointer; }
.today-button { padding: 0.5rem 1rem; background: var(--theme-accent); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
.calendar-content { flex: 1; padding: 0 2rem; overflow: auto; }
.month-view { }
.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--theme-border); margin-bottom: 1px; }
.weekday { padding: 0.5rem; background: var(--theme-hover); text-align: center; font-weight: 600; font-size: 0.875rem; }
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--theme-border); }
.month-day { min-height: 100px; background: var(--theme-surface); padding: 0.5rem; cursor: pointer; }
.month-day.other-month { opacity: 0.5; }
.month-day.today { background: #dbeafe; }
.day-number { font-weight: 600; margin-bottom: 0.25rem; }
.day-events { }
.event-chip { background: var(--theme-accent); color: white; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.75rem; margin-bottom: 0.125rem; cursor: pointer; }
.add-event-fab { position: fixed; bottom: 2rem; right: 2rem; width: 3rem; height: 3rem; background: var(--theme-accent); color: white; border: none; border-radius: 50%; cursor: pointer; box-shadow: var(--shadow-lg); }
.plus-icon { width: 1.5rem; height: 1.5rem; }
.event-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.event-modal { background: var(--theme-surface); border-radius: 0.5rem; padding: 2rem; max-width: 400px; width: 90%; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.form-group input { width: 100%; padding: 0.5rem; border: 1px solid var(--theme-border); border-radius: 0.25rem; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.btn-primary, .btn-secondary, .btn-danger { padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
.btn-primary { background: var(--theme-accent); color: white; }
.btn-secondary { background: var(--theme-surface); border: 1px solid var(--theme-border); }
.btn-danger { background: #dc2626; color: white; }
</style>