<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Manage your projects and tasks
        </p>
      </div>
      
      <UButton icon="i-heroicons-plus" @click="createProject">
        New Project
      </UButton>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="project in projects"
        :key="project.id"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="openProject(project)"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ project.name }}</h3>
            <UBadge :color="getStatusColor(project.status)" size="xs">
              {{ project.status }}
            </UBadge>
          </div>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ project.description }}</p>
        
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>{{ project.tasks }} tasks</span>
          <span>Due: {{ project.dueDate }}</span>
        </div>
        
        <template #footer>
          <div class="flex items-center space-x-2">
            <div class="flex -space-x-2">
              <UAvatar
                v-for="member in project.members.slice(0, 3)"
                :key="member.id"
                :src="member.avatar"
                size="xs"
              />
            </div>
            <span v-if="project.members.length > 3" class="text-xs text-gray-500">
              +{{ project.members.length - 3 }} more
            </span>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const projects = [
  {
    id: 1,
    name: 'Athena PKM System',
    description: 'Building a private AI-powered knowledge management system',
    status: 'in-progress',
    tasks: 15,
    dueDate: 'Dec 15, 2024',
    members: [
      { id: 1, avatar: 'https://avatars.githubusercontent.com/u/1?v=4' },
      { id: 2, avatar: 'https://avatars.githubusercontent.com/u/2?v=4' }
    ]
  },
  {
    id: 2,
    name: 'Research Pipeline',
    description: 'Automate research collection and analysis workflow',
    status: 'planning',
    tasks: 8,
    dueDate: 'Jan 30, 2025',
    members: [
      { id: 1, avatar: 'https://avatars.githubusercontent.com/u/1?v=4' }
    ]
  }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'green'
    case 'in-progress': return 'blue'
    case 'planning': return 'yellow'
    case 'on-hold': return 'gray'
    default: return 'gray'
  }
}

const createProject = () => {
  // TODO: Implement project creation
  console.log('Creating project')
}

const openProject = (project) => {
  navigateTo(`/projects/${project.id}`)
}
</script>