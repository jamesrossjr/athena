<template>
  <div class="kanban-board h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-gray-600" />
        <h2 class="text-lg font-semibold text-gray-900">{{ boardTitle }}</h2>
        <UBadge :label="`${totalTasks} tasks`" variant="subtle" />
      </div>
      
      <div class="flex items-center gap-2">
        <!-- View Controls -->
        <UButton 
          variant="ghost" 
          icon="i-heroicons-funnel"
          @click="showFilters = !showFilters"
          :color="hasActiveFilters ? 'primary' : 'gray'"
        >
          Filter
        </UButton>
        
        <UButton 
          variant="ghost" 
          icon="i-heroicons-users"
          @click="showTeamView = !showTeamView"
        >
          Team
        </UButton>
        
        <UDropdown :items="viewOptions">
          <UButton variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
        </UDropdown>
      </div>
    </div>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="p-4 bg-gray-50 border-b border-gray-200">
      <div class="flex flex-wrap gap-3">
        <USelectMenu
          v-model="selectedAssignees"
          :options="teamMembers"
          placeholder="Filter by assignee"
          multiple
          by="id"
        >
          <template #label>
            <span v-if="selectedAssignees.length">
              {{ selectedAssignees.length }} assignee(s)
            </span>
            <span v-else>All assignees</span>
          </template>
        </USelectMenu>
        
        <USelectMenu
          v-model="selectedLabels"
          :options="availableLabels"
          placeholder="Filter by label"
          multiple
          by="id"
        >
          <template #label>
            <span v-if="selectedLabels.length">
              {{ selectedLabels.length }} label(s)
            </span>
            <span v-else>All labels</span>
          </template>
        </USelectMenu>
        
        <USelectMenu
          v-model="selectedPriority"
          :options="priorityOptions"
          placeholder="Filter by priority"
        />
        
        <UButton 
          v-if="hasActiveFilters" 
          variant="ghost" 
          @click="clearFilters"
          size="sm"
        >
          Clear all
        </UButton>
      </div>
    </div>

    <!-- Board Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Columns -->
      <div class="flex gap-4 p-4 overflow-x-auto min-h-0">
        <KanbanColumn
          v-for="column in filteredColumns"
          :key="column.id"
          :column="column"
          :tasks="getTasksForColumn(column.id)"
          @task-moved="handleTaskMoved"
          @task-created="handleTaskCreated"
          @task-updated="handleTaskUpdated"
          @task-deleted="handleTaskDeleted"
        />
        
        <!-- Add Column -->
        <div class="flex-shrink-0 w-80">
          <UButton
            variant="ghost"
            block
            class="h-12 border-2 border-dashed border-gray-300 hover:border-gray-400"
            @click="showNewColumnModal = true"
          >
            <template #leading>
              <UIcon name="i-heroicons-plus" />
            </template>
            Add Column
          </UButton>
        </div>
      </div>
    </div>

    <!-- Team Sidebar -->
    <USlideover v-model="showTeamView" side="right">
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Team Overview</h3>
        
        <!-- Team Stats -->
        <div class="space-y-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ activeTasksCount }}</div>
              <div class="text-sm text-blue-800">Active Tasks</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ completedToday }}</div>
              <div class="text-sm text-green-800">Completed Today</div>
            </div>
          </div>
        </div>
        
        <!-- Team Members -->
        <div class="space-y-3">
          <h4 class="font-medium text-gray-900">Team Members</h4>
          <div v-for="member in teamMembers" :key="member.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <UAvatar :src="member.avatar" :alt="member.name" size="sm" />
              <div>
                <div class="font-medium text-gray-900">{{ member.name }}</div>
                <div class="text-sm text-gray-600">{{ getTasksForUser(member.id).length }} tasks</div>
              </div>
            </div>
            <div class="flex gap-1">
              <div 
                v-for="task in getTasksForUser(member.id).slice(0, 3)" 
                :key="task.id"
                class="w-2 h-2 rounded-full"
                :class="getPriorityColor(task.priority)"
              />
              <div v-if="getTasksForUser(member.id).length > 3" class="text-xs text-gray-500">
                +{{ getTasksForUser(member.id).length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- New Column Modal -->
    <UModal v-model="showNewColumnModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add New Column</h3>
        </template>
        
        <UForm :state="newColumnForm" @submit="createColumn">
          <UFormGroup label="Column Name" name="name">
            <UInput v-model="newColumnForm.name" placeholder="e.g., In Review" />
          </UFormGroup>
          
          <UFormGroup label="Column Color" name="color">
            <div class="flex gap-2">
              <button
                v-for="color in columnColors"
                :key="color"
                type="button"
                :class="[
                  'w-8 h-8 rounded-full border-2',
                  newColumnForm.color === color ? 'border-gray-900' : 'border-gray-200'
                ]"
                :style="{ backgroundColor: color }"
                @click="newColumnForm.color = color"
              />
            </div>
          </UFormGroup>
          
          <UFormGroup label="Position" name="position">
            <USelectMenu
              v-model="newColumnForm.position"
              :options="positionOptions"
            />
          </UFormGroup>
        </UForm>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showNewColumnModal = false">
              Cancel
            </UButton>
            <UButton @click="createColumn">
              Create Column
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface Task {
  id: string
  title: string
  description?: string
  columnId: string
  assigneeId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface Column {
  id: string
  name: string
  color: string
  position: number
  taskLimit?: number
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

const props = defineProps<{
  boardId: string
  boardTitle: string
}>()

// Reactive state
const showFilters = ref(false)
const showTeamView = ref(false)
const showNewColumnModal = ref(false)
const selectedAssignees = ref<TeamMember[]>([])
const selectedLabels = ref([])
const selectedPriority = ref(null)

// Board data
const columns = ref<Column[]>([
  { id: '1', name: 'Backlog', color: '#6B7280', position: 1 },
  { id: '2', name: 'To Do', color: '#3B82F6', position: 2 },
  { id: '3', name: 'In Progress', color: '#F59E0B', position: 3 },
  { id: '4', name: 'In Review', color: '#8B5CF6', position: 4 },
  { id: '5', name: 'Done', color: '#10B981', position: 5 }
])

const tasks = ref<Task[]>([
  {
    id: '1',
    title: 'Design user onboarding flow',
    description: 'Create wireframes and prototypes for new user experience',
    columnId: '2',
    assigneeId: 'user1',
    priority: 'high',
    labels: ['design', 'ux'],
    dueDate: new Date('2024-01-20'),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Implement real-time notifications',
    columnId: '3',
    assigneeId: 'user2',
    priority: 'medium',
    labels: ['backend', 'feature'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

const teamMembers = ref<TeamMember[]>([
  {
    id: 'user1',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    role: 'Designer'
  },
  {
    id: 'user2',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?u=bob',
    role: 'Developer'
  }
])

// Form state
const newColumnForm = ref({
  name: '',
  color: '#3B82F6',
  position: 'end'
})

// Constants
const columnColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']
const priorityOptions = [
  { label: 'All Priorities', value: null },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

const positionOptions = [
  { label: 'At beginning', value: 'start' },
  { label: 'At end', value: 'end' }
]

const viewOptions = [
  [{
    label: 'Board Settings',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => console.log('Board settings')
  }],
  [{
    label: 'Export Board',
    icon: 'i-heroicons-arrow-down-tray',
    click: () => console.log('Export board')
  }],
  [{
    label: 'Archive Board',
    icon: 'i-heroicons-archive-box',
    click: () => console.log('Archive board')
  }]
]

// Computed properties
const filteredColumns = computed(() => {
  return columns.value.sort((a, b) => a.position - b.position)
})

const totalTasks = computed(() => tasks.value.length)

const activeTasksCount = computed(() => {
  return tasks.value.filter(task => task.columnId !== '5').length
})

const completedToday = computed(() => {
  const today = new Date().toDateString()
  return tasks.value.filter(task => 
    task.columnId === '5' && 
    task.updatedAt.toDateString() === today
  ).length
})

const hasActiveFilters = computed(() => {
  return selectedAssignees.value.length > 0 || 
         selectedLabels.value.length > 0 || 
         selectedPriority.value !== null
})

const availableLabels = computed(() => {
  const labels = new Set()
  tasks.value.forEach(task => {
    task.labels.forEach(label => labels.add(label))
  })
  return Array.from(labels).map(label => ({ id: label, label }))
})

// Methods
const getTasksForColumn = (columnId: string) => {
  let filteredTasks = tasks.value.filter(task => task.columnId === columnId)
  
  // Apply filters
  if (selectedAssignees.value.length > 0) {
    filteredTasks = filteredTasks.filter(task => 
      selectedAssignees.value.some(assignee => assignee.id === task.assigneeId)
    )
  }
  
  if (selectedLabels.value.length > 0) {
    filteredTasks = filteredTasks.filter(task =>
      task.labels.some(label => selectedLabels.value.includes(label))
    )
  }
  
  if (selectedPriority.value) {
    filteredTasks = filteredTasks.filter(task => task.priority === selectedPriority.value)
  }
  
  return filteredTasks
}

const getTasksForUser = (userId: string) => {
  return tasks.value.filter(task => task.assigneeId === userId)
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-400'
  }
  return colors[priority] || 'bg-gray-400'
}

const clearFilters = () => {
  selectedAssignees.value = []
  selectedLabels.value = []
  selectedPriority.value = null
}

const handleTaskMoved = (taskId: string, newColumnId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.columnId = newColumnId
    task.updatedAt = new Date()
  }
}

const handleTaskCreated = (columnId: string, taskData: any) => {
  const newTask: Task = {
    id: Date.now().toString(),
    ...taskData,
    columnId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  tasks.value.push(newTask)
}

const handleTaskUpdated = (taskId: string, updates: any) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    Object.assign(task, updates)
    task.updatedAt = new Date()
  }
}

const handleTaskDeleted = (taskId: string) => {
  tasks.value = tasks.value.filter(t => t.id !== taskId)
}

const createColumn = () => {
  const newColumn: Column = {
    id: Date.now().toString(),
    name: newColumnForm.value.name,
    color: newColumnForm.value.color,
    position: newColumnForm.value.position === 'start' ? 0 : columns.value.length + 1
  }
  
  if (newColumnForm.value.position === 'start') {
    columns.value.forEach(col => col.position++)
  }
  
  columns.value.push(newColumn)
  showNewColumnModal.value = false
  newColumnForm.value = { name: '', color: '#3B82F6', position: 'end' }
}
</script>

<style scoped>
.kanban-board {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
</style>