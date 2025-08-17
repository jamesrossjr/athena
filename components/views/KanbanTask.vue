<template>
  <div
    :draggable="true"
    class="kanban-task bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200"
    :class="{ 'shadow-lg': isDragging }"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="showTaskDetails = true"
  >
    <!-- Priority Indicator -->
    <div class="flex items-start justify-between mb-2">
      <div 
        class="w-1 h-4 rounded-full flex-shrink-0"
        :class="getPriorityColor(task.priority)"
      />
      <UDropdown :items="taskActions" :popper="{ placement: 'bottom-end' }">
        <UButton 
          variant="ghost" 
          icon="i-heroicons-ellipsis-horizontal" 
          size="xs"
          @click.stop
        />
      </UDropdown>
    </div>

    <!-- Task Title -->
    <h4 class="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
      {{ task.title }}
    </h4>

    <!-- Task Description -->
    <p 
      v-if="task.description" 
      class="text-xs text-gray-600 mb-3 line-clamp-2"
    >
      {{ task.description }}
    </p>

    <!-- Labels -->
    <div v-if="task.labels.length > 0" class="flex flex-wrap gap-1 mb-3">
      <UBadge
        v-for="label in task.labels.slice(0, 3)"
        :key="label"
        :label="label"
        size="xs"
        variant="subtle"
      />
      <UBadge
        v-if="task.labels.length > 3"
        :label="`+${task.labels.length - 3}`"
        size="xs"
        variant="subtle"
        color="gray"
      />
    </div>

    <!-- Task Footer -->
    <div class="flex items-center justify-between">
      <!-- Due Date -->
      <div v-if="task.dueDate" class="flex items-center gap-1">
        <UIcon 
          name="i-heroicons-calendar-days" 
          class="w-3 h-3"
          :class="getDueDateColor(task.dueDate)"
        />
        <span 
          class="text-xs"
          :class="getDueDateColor(task.dueDate)"
        >
          {{ formatDueDate(task.dueDate) }}
        </span>
      </div>
      
      <div class="flex-1" />

      <!-- Assignee -->
      <UAvatar
        v-if="assignee"
        :src="assignee.avatar"
        :alt="assignee.name"
        size="xs"
        :ui="{ wrapper: 'ring-2 ring-white' }"
      />
    </div>

    <!-- Task Details Modal -->
    <UModal v-model="showTaskDetails" :ui="{ width: 'max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-3 h-3 rounded-full"
                :class="getPriorityColor(task.priority)"
              />
              <h3 class="text-lg font-semibold">Task Details</h3>
            </div>
            <UButton 
              variant="ghost" 
              icon="i-heroicons-x-mark" 
              @click="showTaskDetails = false"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Title -->
          <UFormGroup label="Title">
            <UInput
              v-model="editableTask.title"
              placeholder="Task title"
              @blur="updateTask"
            />
          </UFormGroup>

          <!-- Description -->
          <UFormGroup label="Description">
            <UTextarea
              v-model="editableTask.description"
              placeholder="Add a description..."
              :rows="4"
              @blur="updateTask"
            />
          </UFormGroup>

          <!-- Assignee -->
          <UFormGroup label="Assignee">
            <USelectMenu
              v-model="editableTask.assigneeId"
              :options="teamMembers"
              placeholder="Select assignee"
              option-attribute="name"
              value-attribute="id"
              @change="updateTask"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <UAvatar :src="option.avatar" :alt="option.name" size="xs" />
                  <span>{{ option.name }}</span>
                </div>
              </template>
            </USelectMenu>
          </UFormGroup>

          <!-- Priority -->
          <UFormGroup label="Priority">
            <USelectMenu
              v-model="editableTask.priority"
              :options="priorityOptions"
              @change="updateTask"
            />
          </UFormGroup>

          <!-- Due Date -->
          <UFormGroup label="Due Date">
            <UInput
              v-model="dueDateInput"
              type="date"
              @change="updateDueDate"
            />
          </UFormGroup>

          <!-- Labels -->
          <UFormGroup label="Labels">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="label in editableTask.labels"
                :key="label"
                :label="label"
                variant="subtle"
                @click="removeLabel(label)"
                class="cursor-pointer"
              />
              <UInput
                v-model="newLabel"
                placeholder="Add label..."
                size="sm"
                class="w-32"
                @keydown.enter="addLabel"
              />
            </div>
          </UFormGroup>

          <!-- Comments Section -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Comments</h4>
            <div class="space-y-3 mb-4">
              <div
                v-for="comment in taskComments"
                :key="comment.id"
                class="flex gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <UAvatar 
                  :src="comment.author.avatar" 
                  :alt="comment.author.name" 
                  size="sm" 
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm">{{ comment.author.name }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <p class="text-sm text-gray-700">{{ comment.content }}</p>
                </div>
              </div>
            </div>
            
            <!-- Add Comment -->
            <div class="flex gap-3">
              <UAvatar src="https://i.pravatar.cc/150?u=current" size="sm" />
              <div class="flex-1">
                <UTextarea
                  v-model="newComment"
                  placeholder="Add a comment..."
                  :rows="2"
                  @keydown.ctrl.enter="addComment"
                />
                <div class="flex justify-end mt-2">
                  <UButton size="sm" @click="addComment">
                    Add Comment
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton 
              variant="ghost" 
              color="red" 
              @click="deleteTask"
            >
              Delete Task
            </UButton>
            <UButton @click="showTaskDetails = false">
              Close
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

interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

interface Comment {
  id: string
  content: string
  author: TeamMember
  createdAt: Date
}

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  dragStart: [taskId: string]
  taskUpdated: [updates: any]
  taskDeleted: []
}>()

// Reactive state
const isDragging = ref(false)
const showTaskDetails = ref(false)
const editableTask = ref({ ...props.task })
const newLabel = ref('')
const newComment = ref('')

// Mock data
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

const taskComments = ref<Comment[]>([
  {
    id: '1',
    content: 'This looks great! Can we add more detail to the wireframes?',
    author: teamMembers.value[1],
    createdAt: new Date(Date.now() - 86400000) // 1 day ago
  }
])

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

const taskActions = [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: () => showTaskDetails.value = true
  }],
  [{
    label: 'Duplicate',
    icon: 'i-heroicons-document-duplicate',
    click: () => duplicateTask()
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => deleteTask()
  }]
]

// Computed properties
const assignee = computed(() => {
  return teamMembers.value.find(member => member.id === props.task.assigneeId)
})

const dueDateInput = computed({
  get() {
    return editableTask.value.dueDate 
      ? new Date(editableTask.value.dueDate).toISOString().split('T')[0]
      : ''
  },
  set(value: string) {
    editableTask.value.dueDate = value ? new Date(value) : undefined
  }
})

// Methods
const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-400'
  }
  return colors[priority] || 'bg-gray-400'
}

const getDueDateColor = (dueDate: Date) => {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'text-red-600' // Overdue
  if (diffDays <= 1) return 'text-orange-600' // Due soon
  if (diffDays <= 3) return 'text-yellow-600' // Due this week
  return 'text-gray-600' // Future
}

const formatDueDate = (dueDate: Date) => {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`
  if (diffDays <= 7) return `${diffDays} days`
  return due.toLocaleDateString()
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    .format(Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day')
}

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true
  emit('dragStart', props.task.id)
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', props.task.id)
}

const handleDragEnd = () => {
  isDragging.value = false
}

const updateTask = () => {
  emit('taskUpdated', { ...editableTask.value })
}

const updateDueDate = () => {
  updateTask()
}

const addLabel = () => {
  if (newLabel.value.trim() && !editableTask.value.labels.includes(newLabel.value.trim())) {
    editableTask.value.labels.push(newLabel.value.trim())
    newLabel.value = ''
    updateTask()
  }
}

const removeLabel = (label: string) => {
  editableTask.value.labels = editableTask.value.labels.filter(l => l !== label)
  updateTask()
}

const addComment = () => {
  if (newComment.value.trim()) {
    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment.value.trim(),
      author: {
        id: 'current',
        name: 'Current User',
        email: 'current@example.com',
        avatar: 'https://i.pravatar.cc/150?u=current',
        role: 'User'
      },
      createdAt: new Date()
    }
    taskComments.value.push(comment)
    newComment.value = ''
  }
}

const duplicateTask = () => {
  const duplicatedTask = {
    ...props.task,
    id: Date.now().toString(),
    title: `${props.task.title} (Copy)`,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  console.log('Duplicating task:', duplicatedTask)
}

const deleteTask = () => {
  if (confirm('Are you sure you want to delete this task?')) {
    emit('taskDeleted')
    showTaskDetails.value = false
  }
}

// Watch for task prop changes
watch(() => props.task, (newTask) => {
  editableTask.value = { ...newTask }
}, { deep: true })
</script>

<style scoped>
.kanban-task {
  transition: all 0.2s ease;
}

.kanban-task:hover {
  transform: translateY(-1px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>