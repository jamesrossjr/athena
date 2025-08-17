<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p class="text-gray-600">
          Manage your workspace, team members, and billing settings.
        </p>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-users" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalMembers }}</p>
              <p class="text-sm text-gray-600">Team Members</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalDocuments }}</p>
              <p class="text-sm text-gray-600">Documents</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 rounded-lg">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.monthlyActive }}</p>
              <p class="text-sm text-gray-600">Monthly Active</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-orange-100 rounded-lg">
              <UIcon name="i-heroicons-puzzle-piece" class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.pluginsInstalled }}</p>
              <p class="text-sm text-gray-600">Plugins Installed</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Team Management -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold">Team Members</h2>
                <UButton @click="showInviteModal = true" size="sm">
                  Invite Member
                </UButton>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="member in teamMembers"
                :key="member.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ member.user.name?.charAt(0) || member.user.email.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium">{{ member.user.name || member.user.email }}</p>
                    <p class="text-sm text-gray-600">{{ member.user.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <UBadge :color="getRoleColor(member.role)" variant="soft">
                    {{ member.role }}
                  </UBadge>
                  <UDropdown :items="getMemberActions(member)">
                    <UButton variant="ghost" icon="i-heroicons-ellipsis-vertical" />
                  </UDropdown>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Workspace Settings -->
        <div class="space-y-6">
          <!-- Workspace Info -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Workspace Settings</h3>
            </template>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <UInput v-model="workspaceName" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <UTextarea v-model="workspaceDescription" :rows="3" />
              </div>
              <UButton @click="updateWorkspace" block>
                Save Changes
              </UButton>
            </div>
          </UCard>

          <!-- Billing Info -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Billing</h3>
            </template>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">Current Plan</p>
                  <p class="text-sm text-gray-600">Team Plan</p>
                </div>
                <UBadge color="green" variant="soft">Active</UBadge>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">Next Billing</p>
                  <p class="text-sm text-gray-600">{{ nextBillingDate }}</p>
                </div>
                <p class="font-medium">$49/month</p>
              </div>
              <UButton variant="outline" block>
                Manage Subscription
              </UButton>
            </div>
          </UCard>

          <!-- Security -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Security</h3>
            </template>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm">Two-factor authentication</span>
                <UToggle v-model="twoFactorEnabled" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Require SSO</span>
                <UToggle v-model="ssoRequired" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Audit logs</span>
                <UButton variant="ghost" size="sm">View</UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Invite Member Modal -->
      <UModal v-model="showInviteModal">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Invite Team Member</h3>
          </template>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <UInput v-model="inviteEmail" placeholder="colleague@company.com" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <USelect
                v-model="inviteRole"
                :options="roleOptions"
                placeholder="Select role"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Personal Message (Optional)
              </label>
              <UTextarea
                v-model="inviteMessage"
                placeholder="Welcome to our team!"
                :rows="3"
              />
            </div>
          </div>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showInviteModal = false">
                Cancel
              </UButton>
              <UButton
                :loading="sendingInvite"
                @click="sendInvite"
              >
                Send Invite
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TeamMember {
  id: string
  user: {
    id: string
    email: string
    name?: string
  }
  role: string
  joinedAt: string
}

useHead({
  title: 'Admin Dashboard - Athena'
})

// Reactive data
const stats = ref({
  totalMembers: 8,
  totalDocuments: 142,
  monthlyActive: 6,
  pluginsInstalled: 3
})

const teamMembers = ref<TeamMember[]>([
  {
    id: '1',
    user: { id: '1', email: 'john.doe@company.com', name: 'John Doe' },
    role: 'ADMIN',
    joinedAt: '2024-01-15'
  },
  {
    id: '2',
    user: { id: '2', email: 'jane.smith@company.com', name: 'Jane Smith' },
    role: 'MEMBER',
    joinedAt: '2024-02-01'
  },
  {
    id: '3',
    user: { id: '3', email: 'bob.wilson@company.com', name: 'Bob Wilson' },
    role: 'GUEST',
    joinedAt: '2024-02-15'
  }
])

const workspaceName = ref('Acme Corp Workspace')
const workspaceDescription = ref('Our collaborative workspace for product development and documentation.')
const twoFactorEnabled = ref(true)
const ssoRequired = ref(false)
const nextBillingDate = ref('March 15, 2024')

// Invite modal
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('MEMBER')
const inviteMessage = ref('')
const sendingInvite = ref(false)

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Guest', value: 'GUEST' }
]

function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'red'
    case 'MEMBER': return 'blue'
    case 'GUEST': return 'gray'
    default: return 'gray'
  }
}

function getMemberActions(member: TeamMember) {
  return [
    [{
      label: 'Change Role',
      icon: 'i-heroicons-key',
      click: () => changeRole(member)
    }],
    [{
      label: 'Remove Member',
      icon: 'i-heroicons-user-minus',
      click: () => removeMember(member)
    }]
  ]
}

async function sendInvite() {
  sendingInvite.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const toast = useToast()
    toast.add({
      title: 'Invite Sent',
      description: `Invitation sent to ${inviteEmail.value}`,
      color: 'green'
    })
    
    // Reset form
    inviteEmail.value = ''
    inviteRole.value = 'MEMBER'
    inviteMessage.value = ''
    showInviteModal.value = false
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: 'Failed to Send Invite',
      description: 'Please try again later.',
      color: 'red'
    })
  } finally {
    sendingInvite.value = false
  }
}

function changeRole(member: TeamMember) {
  const toast = useToast()
  toast.add({
    title: 'Feature Coming Soon',
    description: 'Role management will be available in the next update.',
    color: 'blue'
  })
}

function removeMember(member: TeamMember) {
  const toast = useToast()
  toast.add({
    title: 'Feature Coming Soon',
    description: 'Member removal will be available in the next update.',
    color: 'blue'
  })
}

function updateWorkspace() {
  const toast = useToast()
  toast.add({
    title: 'Settings Updated',
    description: 'Workspace settings have been saved.',
    color: 'green'
  })
}
</script>