<template>
  <div class="timeline-view h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-600" />
          <h2 class="text-lg font-semibold text-gray-900">Timeline</h2>
        </div>
        
        <!-- View Toggle -->
        <UTabs v-model="selectedView" :items="viewTabs" class="w-auto" />
      </div>

      <div class="flex items-center gap-3">
        <!-- Zoom Controls -->
        <div class="flex items-center gap-1">
          <UButton
            variant="ghost"
            icon="i-heroicons-minus"
            size="sm"
            @click="zoomOut"
          />
          <span class="text-sm text-gray-600 min-w-[80px] text-center">{{ zoomLevel }}%</span>
          <UButton
            variant="ghost"
            icon="i-heroicons-plus"
            size="sm"
            @click="zoomIn"
          />
        </div>

        <!-- Date Range -->
        <div class="flex items-center gap-2">
          <UInput
            v-model="dateRange.start"
            type="date"
            size="sm"
          />
          <span class="text-gray-400">to</span>
          <UInput
            v-model="dateRange.end"
            type="date"
            size="sm"
          />
        </div>

        <!-- Actions -->
        <UButton @click="showTaskModal = true">
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          Add Task
        </UButton>
      </div>
    </div>

    <!-- Timeline Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Gantt Chart View -->
      <div v-if="selectedView === 0" class="h-full">
        <GanttChart
          :tasks="filteredTasks"
          :date-range="dateRange"
          :zoom-level="zoomLevel"
          @task-updated="updateTask"
          @task-dependency-created="createDependency"
          @task-click="openTaskDetails"
        />
      </div>

      <!-- Kanban Timeline -->
      <div v-else-if="selectedView === 1" class="h-full p-4">
        <KanbanTimeline
          :tasks="filteredTasks"
          :date-range="dateRange"
          @task-moved="moveTask"
          @task-updated="updateTask"
        />
      </div>

      <!-- Calendar Timeline -->
      <div v-else class="h-full">
        <CalendarTimeline
          :tasks="filteredTasks"
          :milestones="milestones"
          :date-range="dateRange"
          @task-click="openTaskDetails"
          @milestone-click="openMilestoneDetails"
        />
      </div>
    </div>

    <!-- Sidebar -->
    <div class="fixed right-4 top-20 bottom-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 overflow-y-auto">
      <div class="space-y-6">
        <!-- Project Overview -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Project Overview</h3>
          <div class="space-y-3">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Progress</span>
                <span class="text-sm text-gray-600">{{ projectProgress }}%</span>
              </div>
              <UProgress :value="projectProgress" color="primary" />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-lg font-bold text-blue-600">{{ taskStats.total }}</div>
                <div class="text-xs text-blue-800">Total Tasks</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-lg font-bold text-green-600">{{ taskStats.completed }}</div>
                <div class="text-xs text-green-800">Completed</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Critical Path -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Critical Path</h3>
          <div class="space-y-2">
            <div
              v-for="task in criticalPathTasks"
              :key="task.id"
              class="p-2 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100"
              @click="openTaskDetails(task)"
            >
              <div class="font-medium text-red-800 text-sm">{{ task.title }}</div>
              <div class="text-xs text-red-600">
                {{ formatDate(task.startDate) }} - {{ formatDate(task.endDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Milestones -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Upcoming Milestones</h3>
          <div class="space-y-2">
            <div
              v-for="milestone in upcomingMilestones"
              :key="milestone.id"
              class="p-2 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100"
              @click="openMilestoneDetails(milestone)"
            >
              <div class="flex items-center gap-2 mb-1">
                <UIcon name="i-heroicons-flag" class="w-3 h-3 text-yellow-600" />
                <span class="font-medium text-yellow-800 text-sm">{{ milestone.title }}</span>
              </div>
              <div class="text-xs text-yellow-600">
                {{ formatDate(milestone.dueDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Team Workload -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Team Workload</h3>
          <div class="space-y-3">
            <div
              v-for="member in teamWorkload"
              :key="member.id"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UAvatar :src="member.avatar" :alt="member.name" size="xs" />
                  <span class="text-sm font-medium">{{ member.name }}</span>
                </div>
                <span class="text-xs text-gray-600">{{ member.workload }}%</span>
              </div>
              <UProgress 
                :value="member.workload" 
                :color="getWorkloadColor(member.workload)"
                size="xs"
              />
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Filters</h3>
          <div class="space-y-3">
            <UFormGroup label="Assignee">
              <USelectMenu
                v-model="selectedAssignees"
                :options="teamMembers"
                option-attribute="name"
                value-attribute="id"
                multiple
              />
            </UFormGroup>
            
            <UFormGroup label="Priority">
              <USelectMenu
                v-model="selectedPriorities"
                :options="priorityOptions"
                multiple
              />
            </UFormGroup>
            
            <UFormGroup label="Status">
              <USelectMenu
                v-model="selectedStatuses"
                :options="statusOptions"
                multiple
              />
            </UFormGroup>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <UModal v-model="showTaskModal" :ui="{ width: 'max-w-2xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ editingTask ? 'Edit Task' : 'Add New Task' }}
          </h3>
        </template>

        <UForm :state="taskForm" @submit="saveTask">
          <div class="space-y-4">
            <UFormGroup label="Task Title" name="title" required>
              <UInput v-model="taskForm.title" placeholder="Task title" />
            </UFormGroup>

            <UFormGroup label="Description" name="description">
              <UTextarea v-model="taskForm.description" placeholder="Task description" :rows="3" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Start Date" name="startDate" required>
                <UInput v-model="taskForm.startDate" type="date" />
              </UFormGroup>

              <UFormGroup label="End Date" name="endDate" required>
                <UInput v-model="taskForm.endDate" type="date" />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Priority" name="priority">
                <USelectMenu
                  v-model="taskForm.priority"
                  :options="priorityOptions"
                />
              </UFormGroup>

              <UFormGroup label="Progress" name="progress">
                <div class="flex items-center gap-3">
                  <URange
                    v-model="taskForm.progress"
                    :min="0"
                    :max="100"
                    :step="5"
                    class="flex-1"
                  />
                  <span class="text-sm text-gray-600 min-w-[40px]">{{ taskForm.progress }}%</span>
                </div>
              </UFormGroup>
            </div>

            <UFormGroup label="Assignee" name="assigneeId">
              <USelectMenu
                v-model="taskForm.assigneeId"
                :options="teamMembers"
                option-attribute="name"
                value-attribute="id"
                placeholder="Select assignee"
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <UAvatar :src="option.avatar" :alt="option.name" size="xs" />
                    <span>{{ option.name }}</span>
                  </div>
                </template>
              </USelectMenu>
            </UFormGroup>

            <UFormGroup label="Dependencies" name="dependencies">
              <USelectMenu
                v-model="taskForm.dependencies"
                :options="availableTasks"
                option-attribute="title"
                value-attribute="id"
                multiple
                placeholder="Select dependent tasks"
              />
            </UFormGroup>

            <UFormGroup label="Tags" name="tags">
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="tag in taskForm.tags"
                  :key="tag"
                  :label="tag"
                  variant="subtle"
                  @click="removeTag(tag)"
                  class="cursor-pointer"
                />
                <UInput
                  v-model="newTag"
                  placeholder="Add tag..."
                  size="sm"
                  class="w-24"
                  @keydown.enter="addTag"
                />
              </div>
            </UFormGroup>
          </div>
        </UForm>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              v-if="editingTask"
              variant="ghost"
              color="red"
              @click="deleteTask"
            >
              Delete Task
            </UButton>
            <div class="flex gap-2 ml-auto">
              <UButton variant="ghost" @click="closeTaskModal">
                Cancel
              </UButton>
              <UButton @click="saveTask">
                {{ editingTask ? 'Update' : 'Create' }}
              </UButton>
            </div>
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
  startDate: Date
  endDate: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  progress: number
  assigneeId?: string
  dependencies: string[]
  tags: string[]
  isCritical: boolean
  estimatedHours: number
  actualHours: number
}

interface Milestone {
  id: string
  title: string
  description?: string
  dueDate: Date
  isCompleted: boolean
  tasks: string[]
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  capacity: number // hours per day
}

// Reactive state
const selectedView = ref(0) // 0: Gantt, 1: Kanban Timeline, 2: Calendar Timeline
const zoomLevel = ref(100)
const showTaskModal = ref(false)
const editingTask = ref<Task | null>(null)
const selectedAssignees = ref<string[]>([])
const selectedPriorities = ref<string[]>([])
const selectedStatuses = ref<string[]>([])
const newTag = ref('')

// Date range
const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
})

// View tabs
const viewTabs = [
  { label: 'Gantt Chart' },
  { label: 'Kanban Timeline' },
  { label: 'Calendar Timeline' }
]

// Sample data
const tasks = ref<Task[]>([
  {
    id: '1',
    title: 'Design System Setup',
    description: 'Create design tokens and component library',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-25'),
    priority: 'high',
    status: 'completed',
    progress: 100,
    assigneeId: 'user1',
    dependencies: [],
    tags: ['design', 'foundation'],
    isCritical: true,
    estimatedHours: 40,
    actualHours: 35
  },
  {
    id: '2',
    title: 'User Authentication',
    description: 'Implement login, registration, and password reset',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-02-05'),
    priority: 'high',
    status: 'in-progress',
    progress: 60,
    assigneeId: 'user2',
    dependencies: ['1'],
    tags: ['backend', 'security'],
    isCritical: true,
    estimatedHours: 60,
    actualHours: 40
  },
  {
    id: '3',
    title: 'Dashboard Development',
    description: 'Create main dashboard with widgets',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-20'),
    priority: 'medium',
    status: 'not-started',
    progress: 0,
    assigneeId: 'user1',
    dependencies: ['1', '2'],
    tags: ['frontend', 'ui'],
    isCritical: false,
    estimatedHours: 80,
    actualHours: 0
  }
])

const milestones = ref<Milestone[]>([
  {
    id: '1',
    title: 'Alpha Release',
    description: 'First working version with core features',
    dueDate: new Date('2024-02-15'),
    isCompleted: false,
    tasks: ['1', '2']
  },
  {
    id: '2',
    title: 'Beta Release',
    description: 'Feature-complete version for testing',
    dueDate: new Date('2024-03-01'),
    isCompleted: false,
    tasks: ['1', '2', '3']
  }
])

const teamMembers = ref<TeamMember[]>([
  {
    id: 'user1',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    capacity: 8
  },
  {
    id: 'user2',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?u=bob',
    capacity: 8
  },
  {
    id: 'user3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    avatar: 'https://i.pravatar.cc/150?u=carol',
    capacity: 6
  }
])

// Form state
const taskForm = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  priority: 'medium',
  progress: 0,
  assigneeId: '',
  dependencies: [],
  tags: []
})

// Options
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

const statusOptions = [
  { label: 'Not Started', value: 'not-started' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' }
]

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (selectedAssignees.value.length > 0) {
    filtered = filtered.filter(task => 
      selectedAssignees.value.includes(task.assigneeId)
    )
  }

  if (selectedPriorities.value.length > 0) {
    filtered = filtered.filter(task => 
      selectedPriorities.value.includes(task.priority)
    )
  }

  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter(task => 
      selectedStatuses.value.includes(task.status)
    )
  }

  return filtered
})

const projectProgress = computed(() => {
  const totalProgress = tasks.value.reduce((sum, task) => sum + task.progress, 0)
  return Math.round(totalProgress / tasks.value.length)
})

const taskStats = computed(() => {
  return {
    total: tasks.value.length,
    completed: tasks.value.filter(task => task.status === 'completed').length,
    inProgress: tasks.value.filter(task => task.status === 'in-progress').length,
    notStarted: tasks.value.filter(task => task.status === 'not-started').length
  }
})

const criticalPathTasks = computed(() => {
  return tasks.value.filter(task => task.isCritical)
})

const upcomingMilestones = computed(() => {
  const now = new Date()
  return milestones.value
    .filter(milestone => milestone.dueDate >= now && !milestone.isCompleted)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 3)
})

const teamWorkload = computed(() => {
  return teamMembers.value.map(member => {
    const memberTasks = tasks.value.filter(task => 
      task.assigneeId === member.id && task.status !== 'completed'
    )
    const totalHours = memberTasks.reduce((sum, task) => {
      const remaining = task.estimatedHours * (1 - task.progress / 100)
      return sum + remaining
    }, 0)
    
    // Calculate workload percentage based on capacity
    const workload = Math.min(100, Math.round((totalHours / (member.capacity * 5)) * 100)) // 5 working days
    
    return {
      ...member,
      workload,
      totalHours
    }
  })
})

const availableTasks = computed(() => {
  return tasks.value.filter(task => task.id !== editingTask.value?.id)
})

// Methods
const zoomIn = () => {
  zoomLevel.value = Math.min(200, zoomLevel.value + 25)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(25, zoomLevel.value - 25)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const getWorkloadColor = (workload: number) => {
  if (workload >= 90) return 'red'
  if (workload >= 70) return 'orange'
  if (workload >= 50) return 'yellow'
  return 'green'
}

const openTaskDetails = (task: Task) => {
  editingTask.value = task
  taskForm.value = {
    title: task.title,
    description: task.description || '',
    startDate: task.startDate.toISOString().split('T')[0],
    endDate: task.endDate.toISOString().split('T')[0],
    priority: task.priority,
    progress: task.progress,
    assigneeId: task.assigneeId || '',
    dependencies: task.dependencies,
    tags: [...task.tags]
  }
  showTaskModal.value = true
}

const openMilestoneDetails = (milestone: Milestone) => {
  console.log('Opening milestone details:', milestone)
}

const updateTask = (taskId: string, updates: Partial<Task>) => {
  const index = tasks.value.findIndex(task => task.id === taskId)
  if (index !== -1) {
    tasks.value[index] = { ...tasks.value[index], ...updates }
  }
}

const moveTask = (taskId: string, newStartDate: Date, newEndDate: Date) => {
  updateTask(taskId, { startDate: newStartDate, endDate: newEndDate })
}

const createDependency = (fromTaskId: string, toTaskId: string) => {
  const toTask = tasks.value.find(task => task.id === toTaskId)
  if (toTask && !toTask.dependencies.includes(fromTaskId)) {
    toTask.dependencies.push(fromTaskId)
  }
}

const saveTask = () => {
  const taskData: Task = {
    id: editingTask.value?.id || Date.now().toString(),
    title: taskForm.value.title,
    description: taskForm.value.description,
    startDate: new Date(taskForm.value.startDate),
    endDate: new Date(taskForm.value.endDate),
    priority: taskForm.value.priority as any,
    status: editingTask.value?.status || 'not-started',
    progress: taskForm.value.progress,
    assigneeId: taskForm.value.assigneeId,
    dependencies: taskForm.value.dependencies,
    tags: taskForm.value.tags,
    isCritical: false, // This would be calculated based on dependencies
    estimatedHours: editingTask.value?.estimatedHours || 0,
    actualHours: editingTask.value?.actualHours || 0
  }

  if (editingTask.value) {
    const index = tasks.value.findIndex(task => task.id === editingTask.value!.id)
    tasks.value[index] = taskData
  } else {
    tasks.value.push(taskData)
  }

  closeTaskModal()
}

const deleteTask = () => {
  if (editingTask.value && confirm('Are you sure you want to delete this task?')) {
    tasks.value = tasks.value.filter(task => task.id !== editingTask.value!.id)
    closeTaskModal()
  }
}

const closeTaskModal = () => {
  showTaskModal.value = false
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    progress: 0,
    assigneeId: '',
    dependencies: [],
    tags: []
  }
}

const addTag = () => {
  if (newTag.value.trim() && !taskForm.value.tags.includes(newTag.value.trim())) {
    taskForm.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  taskForm.value.tags = taskForm.value.tags.filter(t => t !== tag)
}

// Initialize filters
onMounted(() => {
  selectedAssignees.value = teamMembers.value.map(member => member.id)
  selectedPriorities.value = priorityOptions.map(option => option.value)
  selectedStatuses.value = statusOptions.map(option => option.value)
})
</script>

<style scoped>
.timeline-view {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
</style>