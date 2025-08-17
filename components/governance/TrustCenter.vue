<template>
  <div class="trust-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Athena Trust Center</h1>
              <p class="text-sm text-gray-600">Transparency, Security, and Governance</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-800 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span class="text-sm font-medium">All Systems Operational</span>
            </div>
            <UButton @click="downloadComplianceReport">
              <template #leading>
                <UIcon name="i-heroicons-document-arrow-down" />
              </template>
              Compliance Report
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex flex-wrap gap-2 mb-8">
        <UButton
          v-for="tab in tabs"
          :key="tab.id"
          :variant="activeTab === tab.id ? 'solid' : 'ghost'"
          size="sm"
          @click="activeTab = tab.id"
        >
          <template #leading>
            <UIcon :name="tab.icon" />
          </template>
          {{ tab.label }}
        </UButton>
      </div>

      <!-- System Status -->
      <div v-if="activeTab === 'status'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="service in systemServices"
            :key="service.name"
            class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900">{{ service.name }}</h3>
              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': service.status === 'operational',
                  'bg-yellow-500': service.status === 'degraded',
                  'bg-red-500': service.status === 'outage'
                }"
              />
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Uptime</span>
                <span class="font-medium">{{ service.uptime }}%</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Response Time</span>
                <span class="font-medium">{{ service.responseTime }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Real-time Metrics -->
        <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Real-time Performance</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">{{ metrics.activeUsers.toLocaleString() }}</div>
              <div class="text-sm text-gray-600">Active Users</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">{{ metrics.documentsProcessed.toLocaleString() }}</div>
              <div class="text-sm text-gray-600">Documents Processed Today</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600">{{ metrics.aiQueries.toLocaleString() }}</div>
              <div class="text-sm text-gray-600">AI Queries This Hour</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security & Privacy -->
      <div v-if="activeTab === 'security'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Security Measures -->
          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Security Infrastructure</h3>
            <div class="space-y-4">
              <div
                v-for="measure in securityMeasures"
                :key="measure.name"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <UIcon :name="measure.icon" class="w-5 h-5 text-green-600" />
                  <span class="font-medium">{{ measure.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-green-600" />
                  <span class="text-sm text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Compliance Certifications -->
          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Compliance Certifications</h3>
            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="cert in certifications"
                :key="cert.name"
                class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div class="text-2xl font-bold text-blue-600">{{ cert.name }}</div>
                <div class="text-xs text-blue-600 mt-1">{{ cert.status }}</div>
                <div class="text-xs text-gray-500 mt-2">Expires: {{ cert.expires }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Controls -->
        <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Privacy & Data Protection</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div class="font-semibold">End-to-End Encryption</div>
              <div class="text-sm text-gray-600 mt-1">AES-256 encryption for all data</div>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <UIcon name="i-heroicons-shield-check" class="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div class="font-semibold">Zero Knowledge Architecture</div>
              <div class="text-sm text-gray-600 mt-1">We cannot access your data</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div class="font-semibold">Global Data Residency</div>
              <div class="text-sm text-gray-600 mt-1">Choose where your data lives</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Governance -->
      <div v-if="activeTab === 'governance'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Plugin Review Board -->
          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Plugin Review Board</h3>
            <div class="space-y-4">
              <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center gap-3 mb-2">
                  <UIcon name="i-heroicons-users" class="w-5 h-5 text-blue-600" />
                  <span class="font-semibold text-blue-900">Review Process</span>
                </div>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>• Security vulnerability assessment</li>
                  <li>• Performance impact analysis</li>
                  <li>• Code quality review</li>
                  <li>• Privacy compliance check</li>
                </ul>
              </div>
              <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div class="text-2xl font-bold text-green-600">{{ pluginStats.approved }}</div>
                  <div class="text-sm text-gray-600">Approved Plugins</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-yellow-600">{{ pluginStats.pending }}</div>
                  <div class="text-sm text-gray-600">Under Review</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Governance -->
          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Data Governance</h3>
            <div class="space-y-3">
              <div
                v-for="policy in dataPolicies"
                :key="policy.name"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span class="font-medium">{{ policy.name }}</span>
                <UButton size="xs" variant="ghost" @click="viewPolicy(policy)">
                  View Policy
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Audit Trail -->
        <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Audit Events</h3>
          <div class="space-y-3">
            <div
              v-for="event in auditEvents"
              :key="event.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <UIcon :name="event.icon" class="w-4 h-4 text-gray-600" />
                <div>
                  <div class="font-medium">{{ event.action }}</div>
                  <div class="text-sm text-gray-600">{{ event.timestamp }}</div>
                </div>
              </div>
              <div class="text-sm text-gray-500">{{ event.user }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enterprise Controls -->
      <div v-if="activeTab === 'enterprise'" class="space-y-6">
        <!-- Data Residency -->
        <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Data Residency Controls</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="region in dataRegions"
              :key="region.code"
              class="p-4 border border-gray-200 rounded-lg"
              :class="region.active ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold">{{ region.name }}</span>
                <div
                  v-if="region.active"
                  class="w-2 h-2 bg-blue-500 rounded-full"
                />
              </div>
              <div class="text-sm text-gray-600">{{ region.compliance.join(', ') }}</div>
            </div>
          </div>
        </div>

        <!-- eDiscovery & Legal Hold -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">eDiscovery</h3>
            <div class="space-y-4">
              <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-yellow-600" />
                  <span class="font-semibold text-yellow-900">Search & Export</span>
                </div>
                <div class="text-sm text-yellow-800">
                  Advanced search across all documents with legal export formats
                </div>
              </div>
              <UButton block>Request eDiscovery Export</UButton>
            </div>
          </div>

          <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Retention Policies</h3>
            <div class="space-y-3">
              <div
                v-for="policy in retentionPolicies"
                :key="policy.type"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div class="font-medium">{{ policy.type }}</div>
                  <div class="text-sm text-gray-600">{{ policy.period }}</div>
                </div>
                <UButton size="xs" variant="ghost">Edit</UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Incidents -->
      <div v-if="activeTab === 'incidents'" class="space-y-6">
        <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Incident History</h3>
            <div class="text-sm text-gray-600">
              Last 90 days: {{ incidents.filter(i => i.resolved).length }} resolved incidents
            </div>
          </div>
          <div class="space-y-4">
            <div
              v-for="incident in incidents"
              :key="incident.id"
              class="p-4 border border-gray-200 rounded-lg"
              :class="{
                'bg-red-50 border-red-200': incident.severity === 'critical' && !incident.resolved,
                'bg-yellow-50 border-yellow-200': incident.severity === 'medium' && !incident.resolved,
                'bg-green-50 border-green-200': incident.resolved
              }"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="{
                      'bg-red-500': incident.severity === 'critical' && !incident.resolved,
                      'bg-yellow-500': incident.severity === 'medium' && !incident.resolved,
                      'bg-green-500': incident.resolved
                    }"
                  />
                  <span class="font-semibold">{{ incident.title }}</span>
                </div>
                <span class="text-sm text-gray-600">{{ incident.date }}</span>
              </div>
              <div class="text-sm text-gray-700 mb-2">{{ incident.description }}</div>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>Affected: {{ incident.affected }}</span>
                <span>Duration: {{ incident.duration }}</span>
                <span v-if="incident.resolved" class="text-green-600">✓ Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Reactive state
const activeTab = ref('status')

const tabs = [
  { id: 'status', label: 'System Status', icon: 'i-heroicons-cpu-chip' },
  { id: 'security', label: 'Security & Privacy', icon: 'i-heroicons-shield-check' },
  { id: 'governance', label: 'Governance', icon: 'i-heroicons-building-library' },
  { id: 'enterprise', label: 'Enterprise Controls', icon: 'i-heroicons-building-office-2' },
  { id: 'incidents', label: 'Incidents', icon: 'i-heroicons-exclamation-triangle' }
]

// System status data
const systemServices = ref([
  {
    name: 'Core Platform',
    status: 'operational',
    uptime: 99.97,
    responseTime: 120
  },
  {
    name: 'AI Services',
    status: 'operational',
    uptime: 99.94,
    responseTime: 340
  },
  {
    name: 'Real-time Sync',
    status: 'operational',
    uptime: 99.99,
    responseTime: 45
  },
  {
    name: 'File Storage',
    status: 'operational',
    uptime: 99.98,
    responseTime: 80
  }
])

const metrics = ref({
  activeUsers: 47832,
  documentsProcessed: 156943,
  aiQueries: 8754
})

// Security measures
const securityMeasures = [
  { name: 'End-to-End Encryption', icon: 'i-heroicons-lock-closed' },
  { name: 'Multi-Factor Authentication', icon: 'i-heroicons-key' },
  { name: 'SOC 2 Type II Compliance', icon: 'i-heroicons-shield-check' },
  { name: 'Regular Security Audits', icon: 'i-heroicons-document-magnifying-glass' },
  { name: 'Vulnerability Scanning', icon: 'i-heroicons-bug-ant' },
  { name: 'Access Controls & RBAC', icon: 'i-heroicons-users' }
]

const certifications = [
  { name: 'SOC 2', status: 'Type II Certified', expires: '2025-03-15' },
  { name: 'ISO 27001', status: 'Certified', expires: '2025-08-22' },
  { name: 'GDPR', status: 'Compliant', expires: 'Ongoing' },
  { name: 'HIPAA', status: 'Compliant', expires: 'Ongoing' }
]

// Plugin governance
const pluginStats = ref({
  approved: 247,
  pending: 12
})

const dataPolicies = [
  { name: 'Data Classification Policy', type: 'policy' },
  { name: 'Access Control Standards', type: 'standard' },
  { name: 'Data Retention Guidelines', type: 'guideline' },
  { name: 'Privacy Impact Assessment', type: 'assessment' },
  { name: 'Incident Response Plan', type: 'plan' }
]

// Audit events
const auditEvents = [
  {
    id: '1',
    action: 'Plugin Security Review Completed',
    timestamp: '2024-01-20 14:30 UTC',
    user: 'Security Team',
    icon: 'i-heroicons-shield-check'
  },
  {
    id: '2', 
    action: 'Data Export Request Processed',
    timestamp: '2024-01-20 13:15 UTC',
    user: 'admin@enterprise.com',
    icon: 'i-heroicons-arrow-down-tray'
  },
  {
    id: '3',
    action: 'Access Policy Updated',
    timestamp: '2024-01-20 11:45 UTC',
    user: 'Compliance Team',
    icon: 'i-heroicons-document-text'
  }
]

// Enterprise controls
const dataRegions = [
  {
    code: 'us-east',
    name: 'United States East',
    active: true,
    compliance: ['SOC 2', 'FedRAMP']
  },
  {
    code: 'eu-west',
    name: 'Europe West',
    active: false,
    compliance: ['GDPR', 'ISO 27001']
  },
  {
    code: 'ap-south',
    name: 'Asia Pacific',
    active: false,
    compliance: ['ISO 27001', 'Local Regulations']
  }
]

const retentionPolicies = [
  { type: 'Documents', period: '7 years' },
  { type: 'Audit Logs', period: '10 years' },
  { type: 'User Data', period: 'Until deletion request' },
  { type: 'System Logs', period: '2 years' }
]

// Incidents
const incidents = [
  {
    id: '1',
    title: 'Increased API Response Times',
    description: 'Temporary increase in response times due to high load',
    severity: 'medium',
    affected: 'API Users',
    duration: '23 minutes',
    date: '2024-01-15',
    resolved: true
  },
  {
    id: '2',
    title: 'Scheduled Maintenance',
    description: 'Planned database optimization and security updates',
    severity: 'low',
    affected: 'All Users',
    duration: '2 hours',
    date: '2024-01-10',
    resolved: true
  }
]

// Methods
const downloadComplianceReport = () => {
  // Generate and download compliance report
  console.log('Downloading compliance report')
}

const viewPolicy = (policy: any) => {
  // Open policy document
  console.log('Viewing policy:', policy.name)
}

// Auto-refresh metrics
onMounted(() => {
  setInterval(() => {
    // Update real-time metrics
    metrics.value.activeUsers += Math.floor(Math.random() * 100) - 50
    metrics.value.aiQueries += Math.floor(Math.random() * 50)
  }, 30000) // Every 30 seconds
})
</script>

<style scoped>
.trust-center {
  font-family: 'Inter', sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>