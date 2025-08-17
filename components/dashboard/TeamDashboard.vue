<template>
  <div class="team-dashboard h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-users" class="w-6 h-6 text-gray-600" />
          <h1 class="text-2xl font-bold text-gray-900">Team Dashboard</h1>
        </div>
        
        <!-- Team Selector -->
        <USelectMenu
          v-model="selectedTeam"
          :options="teams"
          option-attribute="name"
          value-attribute="id"
          class="w-48"
        />
      </div>

      <div class="flex items-center gap-3">
        <!-- Time Range -->
        <USelectMenu
          v-model="timeRange"
          :options="timeRangeOptions"
          class="w-32"
        />

        <!-- Export -->
        <UButton variant="outline" @click="exportDashboard">
          <template #leading>
            <UIcon name="i-heroicons-arrow-down-tray" />
          </template>
          Export
        </UButton>

        <!-- Settings -->
        <UButton variant="ghost" icon="i-heroicons-cog-6-tooth" @click="showSettings = true" />
      </div>
    </div>

    <!-- Dashboard Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-6 space-y-6">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Projects"
            :value="metrics.activeProjects"
            :change="metrics.activeProjectsChange"
            icon="i-heroicons-briefcase"
            color="blue"
          />
          <MetricCard
            title="Team Velocity"
            :value="`${metrics.velocity} pts`"
            :change="metrics.velocityChange"
            icon="i-heroicons-bolt"
            color="green"
          />
          <MetricCard
            title="Avg. Workload"
            :value="`${metrics.avgWorkload}%`"
            :change="metrics.workloadChange"
            icon="i-heroicons-chart-bar"
            color="yellow"
          />
          <MetricCard
            title="Satisfaction"
            :value="`${metrics.satisfaction}/5`"
            :change="metrics.satisfactionChange"
            icon="i-heroicons-heart"
            color="pink"
          />
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Team Performance -->
          <div class="lg:col-span-2">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">Team Performance</h3>
                  <UTabs v-model="performanceTab" :items="performanceTabs" size="sm" />
                </div>
              </template>

              <!-- Velocity Chart -->
              <div v-if="performanceTab === 0" class="h-80">
                <VelocityChart :data="velocityData" />
              </div>

              <!-- Burndown Chart -->
              <div v-else-if="performanceTab === 1" class="h-80">
                <BurndownChart :data="burndownData" />
              </div>

              <!-- Workload Distribution -->
              <div v-else class="h-80">
                <WorkloadChart :data="workloadData" />
              </div>
            </UCard>
          </div>

          <!-- Team Members -->
          <div>
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">Team Members</h3>
                  <UButton variant="ghost" icon="i-heroicons-plus" size="sm" @click="showAddMember = true">
                    Add
                  </UButton>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="member in teamMembers"
                  :key="member.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  @click="openMemberDetails(member)"
                >
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <UAvatar :src="member.avatar" :alt="member.name" size="sm" />
                      <div 
                        class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                        :class="getStatusColor(member.status)"
                      />
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">{{ member.name }}</div>
                      <div class="text-sm text-gray-600">{{ member.role }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">{{ member.currentTasks }}</div>
                    <div class="text-xs text-gray-500">tasks</div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Project Status & Workload -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Project Status -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Project Status</h3>
            </template>

            <div class="space-y-4">
              <div
                v-for="project in projects"
                :key="project.id"
                class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                @click="openProjectDetails(project)"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">{{ project.name }}</h4>
                  <UBadge 
                    :label="project.status" 
                    :color="getProjectStatusColor(project.status)"
                    variant="subtle"
                  />
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Progress</span>
                    <span class="font-medium">{{ project.progress }}%</span>
                  </div>
                  <UProgress :value="project.progress" :color="getProgressColor(project.progress)" />
                  
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>Due: {{ formatDate(project.dueDate) }}</span>
                    <span>{{ project.teamSize }} members</span>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Workload Heatmap -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Workload Heatmap</h3>
            </template>

            <div class="space-y-4">
              <!-- Calendar Grid -->
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                  :key="day"
                  class="text-xs text-center text-gray-500 py-2"
                >
                  {{ day }}
                </div>
                
                <div
                  v-for="date in workloadCalendar"
                  :key="date.date"
                  class="aspect-square rounded cursor-pointer hover:ring-2 hover:ring-blue-300"
                  :class="getWorkloadColor(date.workload)"
                  :title="`${date.date}: ${date.workload}% workload`"
                  @click="openDateDetails(date)"
                />
              </div>

              <!-- Legend -->
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>Less</span>
                <div class="flex gap-1">
                  <div class="w-3 h-3 bg-green-100 rounded" />
                  <div class="w-3 h-3 bg-green-200 rounded" />
                  <div class="w-3 h-3 bg-green-300 rounded" />
                  <div class="w-3 h-3 bg-green-400 rounded" />
                  <div class="w-3 h-3 bg-green-500 rounded" />
                </div>
                <span>More</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Recent Activity & Blockers -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Activity -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </template>

            <div class="space-y-4">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex gap-3"
              >
                <UAvatar :src="activity.user.avatar" :alt="activity.user.name" size="xs" />
                <div class="flex-1">
                  <div class="text-sm text-gray-900">
                    <span class="font-medium">{{ activity.user.name }}</span>
                    {{ activity.action }}
                    <span class="font-medium">{{ activity.target }}</span>
                  </div>
                  <div class="text-xs text-gray-500">{{ formatRelativeTime(activity.timestamp) }}</div>
                </div>
                <UIcon 
                  :name="getActivityIcon(activity.type)" 
                  class="w-4 h-4 text-gray-400 mt-0.5" 
                />
              </div>
            </div>
          </UCard>

          <!-- Blockers & Issues -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Blockers & Issues</h3>
                <UBadge 
                  :label="blockers.length.toString()" 
                  color="red" 
                  variant="subtle" 
                />
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="blocker in blockers"
                :key="blocker.id"
                class="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-medium text-red-900">{{ blocker.title }}</h4>
                  <UBadge :label="blocker.severity" color="red" size="xs" />
                </div>
                <p class="text-sm text-red-800 mb-2">{{ blocker.description }}</p>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-red-600">Affects: {{ blocker.affectedTasks }} tasks</span>
                  <span class="text-red-500">{{ formatRelativeTime(blocker.reportedAt) }}</span>
                </div>
              </div>

              <UButton variant="outline" color="red" block size="sm" @click="showNewBlocker = true">
                <template #leading>
                  <UIcon name="i-heroicons-exclamation-triangle" />
                </template>
                Report Blocker
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Member Details Modal -->
    <UModal v-model="showMemberDetails" :ui="{ width: 'max-w-2xl' }">
      <UCard v-if="selectedMember">
        <template #header>
          <div class="flex items-center gap-3">
            <UAvatar :src="selectedMember.avatar" :alt="selectedMember.name" />
            <div>
              <h3 class="text-lg font-semibold">{{ selectedMember.name }}</h3>
              <p class="text-sm text-gray-600">{{ selectedMember.role }}</p>
            </div>
          </div>
        </template>

        <!-- Member details content would go here -->
        <div class="space-y-6">
          <!-- Performance Metrics -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Performance</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{{ selectedMember.completedTasks }}</div>
                <div class="text-sm text-blue-800">Completed Tasks</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-green-600">{{ selectedMember.velocity }}</div>
                <div class="text-sm text-green-800">Story Points</div>
              </div>
              <div class="bg-yellow-50 p-3 rounded-lg">
                <div class="text-2xl font-bold text-yellow-600">{{ selectedMember.workload }}%</div>
                <div class="text-sm text-yellow-800">Current Load</div>
              </div>
            </div>
          </div>

          <!-- Current Tasks -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Current Tasks</h4>
            <div class="space-y-2">
              <div
                v-for="task in selectedMember.tasks"
                :key="task.id"
                class="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span class="text-sm font-medium">{{ task.title }}</span>
                <UBadge :label="task.status" variant="subtle" />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  status: 'online' | 'offline' | 'away' | 'busy'
  currentTasks: number
  completedTasks: number
  velocity: number
  workload: number
  tasks: Array<{ id: string; title: string; status: string }>
}

interface Project {
  id: string
  name: string
  status: 'planning' | 'active' | 'on-hold' | 'completed'
  progress: number
  dueDate: Date
  teamSize: number
}

interface Activity {
  id: string
  type: 'task' | 'project' | 'comment' | 'milestone'
  action: string
  target: string
  user: TeamMember
  timestamp: Date
}

interface Blocker {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedTasks: number
  reportedAt: Date
}

// Reactive state
const selectedTeam = ref('team1')
const timeRange = ref('week')
const performanceTab = ref(0)
const showSettings = ref(false)
const showAddMember = ref(false)
const showMemberDetails = ref(false)
const showNewBlocker = ref(false)
const selectedMember = ref<TeamMember | null>(null)

// Mock data
const teams = ref([
  { id: 'team1', name: 'Frontend Team' },
  { id: 'team2', name: 'Backend Team' },
  { id: 'team3', name: 'Design Team' }
])

const timeRangeOptions = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' }
]

const performanceTabs = [
  { label: 'Velocity' },
  { label: 'Burndown' },
  { label: 'Workload' }
]

const metrics = ref({
  activeProjects: 8,
  activeProjectsChange: +2,
  velocity: 45,
  velocityChange: +8,
  avgWorkload: 76,
  workloadChange: -5,
  satisfaction: 4.2,
  satisfactionChange: +0.3
})

const teamMembers = ref<TeamMember[]>([
  {
    id: 'user1',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    role: 'Senior Developer',
    status: 'online',
    currentTasks: 3,
    completedTasks: 24,
    velocity: 18,
    workload: 85,
    tasks: [
      { id: '1', title: 'API Integration', status: 'in-progress' },
      { id: '2', title: 'Code Review', status: 'pending' },
      { id: '3', title: 'Testing', status: 'not-started' }
    ]
  },
  {
    id: 'user2',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?u=bob',
    role: 'UI/UX Designer',
    status: 'busy',
    currentTasks: 2,
    completedTasks: 18,
    velocity: 12,
    workload: 65,
    tasks: [
      { id: '4', title: 'Wireframes', status: 'in-progress' },
      { id: '5', title: 'Prototype', status: 'not-started' }
    ]
  }
])

const projects = ref<Project[]>([
  {
    id: '1',
    name: 'E-commerce Platform',
    status: 'active',
    progress: 75,
    dueDate: new Date('2024-03-15'),
    teamSize: 6
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    status: 'planning',
    progress: 25,
    dueDate: new Date('2024-04-01'),
    teamSize: 4
  }
])

const recentActivity = ref<Activity[]>([
  {
    id: '1',
    type: 'task',
    action: 'completed',
    target: 'User Authentication',
    user: teamMembers.value[0],
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    id: '2',
    type: 'comment',
    action: 'commented on',
    target: 'Dashboard Layout',
    user: teamMembers.value[1],
    timestamp: new Date(Date.now() - 7200000) // 2 hours ago
  }
])

const blockers = ref<Blocker[]>([
  {
    id: '1',
    title: 'API Server Downtime',
    description: 'External API service is experiencing outages affecting development',
    severity: 'high',
    affectedTasks: 5,
    reportedAt: new Date(Date.now() - 86400000) // 1 day ago
  }
])

// Generate workload calendar data
const workloadCalendar = computed(() => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(startOfMonth)
    date.setDate(i + 1)
    
    return {
      date: date.getDate().toString(),
      workload: Math.floor(Math.random() * 100) // Mock workload percentage
    }
  })
})

// Chart data (would be computed from real data)
const velocityData = ref({
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [{
    label: 'Story Points',
    data: [32, 45, 38, 52],
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)'
  }]
})

const burndownData = ref({
  labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
  datasets: [{
    label: 'Remaining Work',
    data: [100, 85, 70, 45, 20],
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  }]
})

const workloadData = ref({
  labels: teamMembers.value.map(m => m.name),
  datasets: [{
    label: 'Workload %',
    data: teamMembers.value.map(m => m.workload),
    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
  }]
})

// Methods
const getStatusColor = (status: string) => {
  const colors = {
    online: 'bg-green-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400',
    offline: 'bg-gray-400'
  }
  return colors[status] || 'bg-gray-400'
}

const getProjectStatusColor = (status: string) => {
  const colors = {
    planning: 'blue',
    active: 'green',
    'on-hold': 'yellow',
    completed: 'gray'
  }
  return colors[status] || 'gray'
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'green'
  if (progress >= 60) return 'blue'
  if (progress >= 40) return 'yellow'
  return 'red'
}

const getWorkloadColor = (workload: number) => {
  if (workload < 20) return 'bg-gray-100'
  if (workload < 40) return 'bg-green-200'
  if (workload < 60) return 'bg-green-300'
  if (workload < 80) return 'bg-green-400'
  return 'bg-green-500'
}

const getActivityIcon = (type: string) => {
  const icons = {
    task: 'i-heroicons-check-circle',
    project: 'i-heroicons-briefcase',
    comment: 'i-heroicons-chat-bubble-left',
    milestone: 'i-heroicons-flag'
  }
  return icons[type] || 'i-heroicons-information-circle'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const openMemberDetails = (member: TeamMember) => {
  selectedMember.value = member
  showMemberDetails.value = true
}

const openProjectDetails = (project: Project) => {
  console.log('Opening project details:', project)
}

const openDateDetails = (date: any) => {
  console.log('Opening date details:', date)
}

const exportDashboard = () => {
  console.log('Exporting dashboard...')
}
</script>

<style scoped>
.team-dashboard {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
</style>