<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Welcome back to your personal knowledge workspace
      </p>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.notes }}</p>
          </div>
          <Icon name="heroicons:document-text" class="h-8 w-8 text-blue-600" />
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.tasks }}</p>
          </div>
          <Icon name="heroicons:check-circle" class="h-8 w-8 text-green-600" />
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Projects</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.projects }}</p>
          </div>
          <Icon name="heroicons:briefcase" class="h-8 w-8 text-purple-600" />
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Briefings</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.briefings }}</p>
          </div>
          <Icon name="heroicons:presentation-chart-line" class="h-8 w-8 text-orange-600" />
        </div>
      </UCard>
    </div>
    
    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Recent Notes</h3>
        </template>
        
        <div class="space-y-3">
          <div
            v-for="note in recentNotes"
            :key="note.id"
            class="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <div class="flex-1">
              <h4 class="font-medium">{{ note.title }}</h4>
              <p class="text-sm text-gray-500">{{ note.updated }}</p>
            </div>
            <Icon name="heroicons:chevron-right" class="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <template #footer>
          <NuxtLink to="/vault" class="text-sm text-blue-600 hover:text-blue-500">
            View all notes →
          </NuxtLink>
        </template>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Upcoming Tasks</h3>
        </template>
        
        <div class="space-y-3">
          <div
            v-for="task in upcomingTasks"
            :key="task.id"
            class="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <div class="flex items-center space-x-3">
              <UCheckbox v-model="task.completed" />
              <div>
                <h4 class="font-medium">{{ task.title }}</h4>
                <p class="text-sm text-gray-500">Due: {{ task.due }}</p>
              </div>
            </div>
            <UBadge
              :color="task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'gray'"
              size="xs"
            >
              {{ task.priority }}
            </UBadge>
          </div>
        </div>
        
        <template #footer>
          <NuxtLink to="/projects" class="text-sm text-blue-600 hover:text-blue-500">
            View all tasks →
          </NuxtLink>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
// Mock data for dashboard
const stats = {
  notes: 127,
  tasks: 23,
  projects: 8,
  briefings: 12
}

const recentNotes = [
  { id: 1, title: 'AI Implementation Strategy', updated: '2 hours ago' },
  { id: 2, title: 'Market Research Findings', updated: '1 day ago' },
  { id: 3, title: 'Team Meeting Notes', updated: '2 days ago' }
]

const upcomingTasks = [
  { id: 1, title: 'Complete RAG pipeline', due: 'Today', priority: 'high', completed: false },
  { id: 2, title: 'Review system architecture', due: 'Tomorrow', priority: 'medium', completed: false },
  { id: 3, title: 'Update documentation', due: 'Friday', priority: 'low', completed: false }
]
</script>