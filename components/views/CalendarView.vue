<template>
  <div class="calendar-view h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-gray-600" />
          <h2 class="text-lg font-semibold text-gray-900">Calendar</h2>
        </div>
        
        <!-- View Toggle -->
        <UTabs v-model="selectedView" :items="viewTabs" class="w-auto" />
      </div>

      <div class="flex items-center gap-3">
        <!-- Date Navigation -->
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            icon="i-heroicons-chevron-left"
            @click="navigateDate(-1)"
          />
          <div class="min-w-[200px] text-center">
            <span class="text-lg font-medium">{{ displayTitle }}</span>
          </div>
          <UButton
            variant="ghost"
            icon="i-heroicons-chevron-right"
            @click="navigateDate(1)"
          />
        </div>

        <!-- Actions -->
        <UButton @click="goToToday">Today</UButton>
        <UButton @click="showNewEventModal = true">
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          New Event
        </UButton>
      </div>
    </div>

    <!-- Calendar Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Month View -->
      <div v-if="selectedView === 0" class="h-full p-4">
        <CalendarMonth
          :current-date="currentDate"
          :events="filteredEvents"
          @event-click="openEventDetails"
          @date-click="handleDateClick"
          @event-drop="handleEventMove"
        />
      </div>

      <!-- Week View -->
      <div v-else-if="selectedView === 1" class="h-full">
        <CalendarWeek
          :current-date="currentDate"
          :events="filteredEvents"
          @event-click="openEventDetails"
          @time-slot-click="handleTimeSlotClick"
          @event-drop="handleEventMove"
          @event-resize="handleEventResize"
        />
      </div>

      <!-- Day View -->
      <div v-else-if="selectedView === 2" class="h-full">
        <CalendarDay
          :current-date="currentDate"
          :events="filteredEvents"
          @event-click="openEventDetails"
          @time-slot-click="handleTimeSlotClick"
          @event-drop="handleEventMove"
          @event-resize="handleEventResize"
        />
      </div>

      <!-- Agenda View -->
      <div v-else class="h-full p-4">
        <CalendarAgenda
          :current-date="currentDate"
          :events="filteredEvents"
          @event-click="openEventDetails"
        />
      </div>
    </div>

    <!-- Sidebar for Filters -->
    <div class="fixed right-4 top-20 bottom-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 overflow-y-auto">
      <div class="space-y-6">
        <!-- Mini Calendar -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Navigate</h3>
          <div class="bg-gray-50 rounded-lg p-3">
            <CalendarMini
              v-model="currentDate"
              :events="events"
              @date-select="currentDate = $event"
            />
          </div>
        </div>

        <!-- Event Types Filter -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Event Types</h3>
          <div class="space-y-2">
            <label
              v-for="type in eventTypes"
              :key="type.id"
              class="flex items-center gap-2"
            >
              <UCheckbox
                v-model="selectedEventTypes"
                :value="type.id"
              />
              <div 
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: type.color }"
              />
              <span class="text-sm">{{ type.name }}</span>
            </label>
          </div>
        </div>

        <!-- Team Members Filter -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Team Members</h3>
          <div class="space-y-2">
            <label
              v-for="member in teamMembers"
              :key="member.id"
              class="flex items-center gap-2"
            >
              <UCheckbox
                v-model="selectedMembers"
                :value="member.id"
              />
              <UAvatar :src="member.avatar" :alt="member.name" size="xs" />
              <span class="text-sm">{{ member.name }}</span>
            </label>
          </div>
        </div>

        <!-- Quick Actions -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div class="space-y-2">
            <UButton variant="ghost" block size="sm" @click="showNewEventModal = true">
              <template #leading>
                <UIcon name="i-heroicons-plus" />
              </template>
              New Event
            </UButton>
            <UButton variant="ghost" block size="sm" @click="syncWithGoogle">
              <template #leading>
                <UIcon name="i-simple-icons-google" />
              </template>
              Sync with Google
            </UButton>
            <UButton variant="ghost" block size="sm" @click="exportCalendar">
              <template #leading>
                <UIcon name="i-heroicons-arrow-down-tray" />
              </template>
              Export Calendar
            </UButton>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Upcoming</h3>
          <div class="space-y-2">
            <div
              v-for="event in upcomingEvents.slice(0, 5)"
              :key="event.id"
              class="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              @click="openEventDetails(event)"
            >
              <div class="flex items-center gap-2 mb-1">
                <div 
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getEventTypeColor(event.type) }"
                />
                <span class="text-sm font-medium truncate">{{ event.title }}</span>
              </div>
              <div class="text-xs text-gray-600">
                {{ formatEventTime(event) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Event Modal -->
    <UModal v-model="showNewEventModal" :ui="{ width: 'max-w-lg' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ editingEvent ? 'Edit Event' : 'New Event' }}
          </h3>
        </template>

        <UForm :state="eventForm" @submit="saveEvent">
          <div class="space-y-4">
            <UFormGroup label="Title" name="title" required>
              <UInput v-model="eventForm.title" placeholder="Event title" />
            </UFormGroup>

            <UFormGroup label="Description" name="description">
              <UTextarea v-model="eventForm.description" placeholder="Event description" :rows="3" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Start Date" name="startDate" required>
                <UInput v-model="eventForm.startDate" type="date" />
              </UFormGroup>

              <UFormGroup label="Start Time" name="startTime">
                <UInput v-model="eventForm.startTime" type="time" />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="End Date" name="endDate">
                <UInput v-model="eventForm.endDate" type="date" />
              </UFormGroup>

              <UFormGroup label="End Time" name="endTime">
                <UInput v-model="eventForm.endTime" type="time" />
              </UFormGroup>
            </div>

            <UFormGroup label="All Day">
              <UToggle v-model="eventForm.allDay" @change="handleAllDayChange" />
            </UFormGroup>

            <UFormGroup label="Event Type" name="type">
              <USelectMenu
                v-model="eventForm.type"
                :options="eventTypes"
                option-attribute="name"
                value-attribute="id"
              />
            </UFormGroup>

            <UFormGroup label="Attendees" name="attendees">
              <USelectMenu
                v-model="eventForm.attendees"
                :options="teamMembers"
                option-attribute="name"
                value-attribute="id"
                multiple
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <UAvatar :src="option.avatar" :alt="option.name" size="xs" />
                    <span>{{ option.name }}</span>
                  </div>
                </template>
              </USelectMenu>
            </UFormGroup>

            <UFormGroup label="Location" name="location">
              <UInput v-model="eventForm.location" placeholder="Event location" />
            </UFormGroup>

            <UFormGroup label="Reminder" name="reminder">
              <USelectMenu
                v-model="eventForm.reminder"
                :options="reminderOptions"
              />
            </UFormGroup>
          </div>
        </UForm>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              v-if="editingEvent"
              variant="ghost"
              color="red"
              @click="deleteEvent"
            >
              Delete
            </UButton>
            <div class="flex gap-2 ml-auto">
              <UButton variant="ghost" @click="closeEventModal">
                Cancel
              </UButton>
              <UButton @click="saveEvent">
                {{ editingEvent ? 'Update' : 'Create' }}
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay: boolean
  type: string
  attendees: string[]
  location?: string
  reminder?: string
  createdBy: string
}

interface EventType {
  id: string
  name: string
  color: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
}

// Reactive state
const selectedView = ref(0) // 0: Month, 1: Week, 2: Day, 3: Agenda
const currentDate = ref(new Date())
const showNewEventModal = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const selectedEventTypes = ref<string[]>([])
const selectedMembers = ref<string[]>([])

// View tabs
const viewTabs = [
  { label: 'Month' },
  { label: 'Week' },
  { label: 'Day' },
  { label: 'Agenda' }
]

// Event types
const eventTypes = ref<EventType[]>([
  { id: 'meeting', name: 'Meeting', color: '#3B82F6' },
  { id: 'deadline', name: 'Deadline', color: '#EF4444' },
  { id: 'milestone', name: 'Milestone', color: '#10B981' },
  { id: 'review', name: 'Review', color: '#8B5CF6' },
  { id: 'workshop', name: 'Workshop', color: '#F59E0B' },
  { id: 'personal', name: 'Personal', color: '#6B7280' }
])

// Team members
const teamMembers = ref<TeamMember[]>([
  {
    id: 'user1',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alice'
  },
  {
    id: 'user2',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?u=bob'
  },
  {
    id: 'user3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    avatar: 'https://i.pravatar.cc/150?u=carol'
  }
])

// Sample events
const events = ref<CalendarEvent[]>([
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily team synchronization meeting',
    startDate: new Date(2024, 0, 15, 9, 0),
    endDate: new Date(2024, 0, 15, 9, 30),
    allDay: false,
    type: 'meeting',
    attendees: ['user1', 'user2', 'user3'],
    location: 'Conference Room A',
    reminder: '15min',
    createdBy: 'user1'
  },
  {
    id: '2',
    title: 'Project Deadline',
    description: 'Final submission for Q1 project',
    startDate: new Date(2024, 0, 20),
    endDate: new Date(2024, 0, 20),
    allDay: true,
    type: 'deadline',
    attendees: ['user1', 'user2'],
    reminder: '1day',
    createdBy: 'user1'
  }
])

// Form state
const eventForm = ref({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
  type: 'meeting',
  attendees: [],
  location: '',
  reminder: 'none'
})

const reminderOptions = [
  { label: 'None', value: 'none' },
  { label: '5 minutes before', value: '5min' },
  { label: '15 minutes before', value: '15min' },
  { label: '30 minutes before', value: '30min' },
  { label: '1 hour before', value: '1hour' },
  { label: '1 day before', value: '1day' }
]

// Computed properties
const displayTitle = computed(() => {
  switch (selectedView.value) {
    case 0: // Month
      return currentDate.value.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    case 1: // Week
      const startOfWeek = new Date(currentDate.value)
      startOfWeek.setDate(currentDate.value.getDate() - currentDate.value.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    case 2: // Day
      return currentDate.value.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric' 
      })
    case 3: // Agenda
      return 'Upcoming Events'
    default:
      return ''
  }
})

const filteredEvents = computed(() => {
  let filtered = events.value

  // Filter by event types
  if (selectedEventTypes.value.length > 0) {
    filtered = filtered.filter(event => selectedEventTypes.value.includes(event.type))
  }

  // Filter by team members
  if (selectedMembers.value.length > 0) {
    filtered = filtered.filter(event => 
      event.attendees.some(attendee => selectedMembers.value.includes(attendee)) ||
      selectedMembers.value.includes(event.createdBy)
    )
  }

  return filtered
})

const upcomingEvents = computed(() => {
  const now = new Date()
  return events.value
    .filter(event => event.startDate >= now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
})

// Initialize filters
onMounted(() => {
  selectedEventTypes.value = eventTypes.value.map(type => type.id)
  selectedMembers.value = teamMembers.value.map(member => member.id)
})

// Methods
const navigateDate = (direction: number) => {
  const newDate = new Date(currentDate.value)
  
  switch (selectedView.value) {
    case 0: // Month
      newDate.setMonth(newDate.getMonth() + direction)
      break
    case 1: // Week
      newDate.setDate(newDate.getDate() + (direction * 7))
      break
    case 2: // Day
      newDate.setDate(newDate.getDate() + direction)
      break
  }
  
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
}

const handleDateClick = (date: Date) => {
  currentDate.value = date
  selectedView.value = 2 // Switch to day view
}

const handleTimeSlotClick = (date: Date) => {
  eventForm.value.startDate = date.toISOString().split('T')[0]
  eventForm.value.startTime = date.toTimeString().split(' ')[0].slice(0, 5)
  
  const endDate = new Date(date.getTime() + 60 * 60 * 1000) // +1 hour
  eventForm.value.endDate = endDate.toISOString().split('T')[0]
  eventForm.value.endTime = endDate.toTimeString().split(' ')[0].slice(0, 5)
  
  showNewEventModal.value = true
}

const openEventDetails = (event: CalendarEvent) => {
  editingEvent.value = event
  eventForm.value = {
    title: event.title,
    description: event.description || '',
    startDate: event.startDate.toISOString().split('T')[0],
    startTime: event.allDay ? '' : event.startDate.toTimeString().split(' ')[0].slice(0, 5),
    endDate: event.endDate.toISOString().split('T')[0],
    endTime: event.allDay ? '' : event.endDate.toTimeString().split(' ')[0].slice(0, 5),
    allDay: event.allDay,
    type: event.type,
    attendees: event.attendees,
    location: event.location || '',
    reminder: event.reminder || 'none'
  }
  showNewEventModal.value = true
}

const handleEventMove = (eventId: string, newStart: Date, newEnd: Date) => {
  const event = events.value.find(e => e.id === eventId)
  if (event) {
    event.startDate = newStart
    event.endDate = newEnd
  }
}

const handleEventResize = (eventId: string, newEnd: Date) => {
  const event = events.value.find(e => e.id === eventId)
  if (event) {
    event.endDate = newEnd
  }
}

const handleAllDayChange = (allDay: boolean) => {
  if (allDay) {
    eventForm.value.startTime = ''
    eventForm.value.endTime = ''
  } else {
    eventForm.value.startTime = '09:00'
    eventForm.value.endTime = '10:00'
  }
}

const saveEvent = () => {
  const startDate = eventForm.value.allDay 
    ? new Date(eventForm.value.startDate)
    : new Date(`${eventForm.value.startDate}T${eventForm.value.startTime}`)
    
  const endDate = eventForm.value.allDay
    ? new Date(eventForm.value.endDate || eventForm.value.startDate)
    : new Date(`${eventForm.value.endDate || eventForm.value.startDate}T${eventForm.value.endTime}`)

  const eventData: CalendarEvent = {
    id: editingEvent.value?.id || Date.now().toString(),
    title: eventForm.value.title,
    description: eventForm.value.description,
    startDate,
    endDate,
    allDay: eventForm.value.allDay,
    type: eventForm.value.type,
    attendees: eventForm.value.attendees,
    location: eventForm.value.location,
    reminder: eventForm.value.reminder,
    createdBy: 'current-user'
  }

  if (editingEvent.value) {
    const index = events.value.findIndex(e => e.id === editingEvent.value!.id)
    events.value[index] = eventData
  } else {
    events.value.push(eventData)
  }

  closeEventModal()
}

const deleteEvent = () => {
  if (editingEvent.value && confirm('Are you sure you want to delete this event?')) {
    events.value = events.value.filter(e => e.id !== editingEvent.value!.id)
    closeEventModal()
  }
}

const closeEventModal = () => {
  showNewEventModal.value = false
  editingEvent.value = null
  eventForm.value = {
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    type: 'meeting',
    attendees: [],
    location: '',
    reminder: 'none'
  }
}

const getEventTypeColor = (typeId: string) => {
  return eventTypes.value.find(type => type.id === typeId)?.color || '#6B7280'
}

const formatEventTime = (event: CalendarEvent) => {
  if (event.allDay) {
    return 'All day'
  }
  return `${event.startDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  })} - ${event.endDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  })}`
}

const syncWithGoogle = () => {
  console.log('Syncing with Google Calendar...')
}

const exportCalendar = () => {
  console.log('Exporting calendar...')
}
</script>

<style scoped>
.calendar-view {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
</style>