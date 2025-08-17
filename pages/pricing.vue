<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-8 py-16">
      <!-- Header -->
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free, scale as you grow. All plans include real-time collaboration and AI assistance.
        </p>
      </div>

      <!-- Pricing Toggle -->
      <div class="flex justify-center mb-12">
        <div class="bg-white p-1 rounded-lg border border-gray-200">
          <div class="flex">
            <button
              :class="[
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                !isYearly ? 'bg-blue-500 text-white' : 'text-gray-700 hover:text-gray-900'
              ]"
              @click="isYearly = false"
            >
              Monthly
            </button>
            <button
              :class="[
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isYearly ? 'bg-blue-500 text-white' : 'text-gray-700 hover:text-gray-900'
              ]"
              @click="isYearly = true"
            >
              Yearly
              <UBadge color="green" variant="soft" class="ml-2">Save 20%</UBadge>
            </button>
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Free Plan -->
        <UCard class="relative">
          <template #header>
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900">Personal</h3>
              <p class="text-gray-600 mt-2">Perfect for individuals</p>
              <div class="mt-4">
                <span class="text-4xl font-bold text-gray-900">$0</span>
                <span class="text-gray-600">/month</span>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Up to 3 workspaces</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Real-time collaboration</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Basic AI assistance</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Community support</span>
              </div>
            </div>
            
            <UButton block variant="outline">
              Get Started
            </UButton>
          </div>
        </UCard>

        <!-- Pro Plan -->
        <UCard class="relative border-2 border-blue-500">
          <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <UBadge color="blue" variant="solid">Most Popular</UBadge>
          </div>
          
          <template #header>
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900">Pro</h3>
              <p class="text-gray-600 mt-2">For growing teams</p>
              <div class="mt-4">
                <span class="text-4xl font-bold text-gray-900">
                  ${{ isYearly ? '19' : '24' }}
                </span>
                <span class="text-gray-600">/month</span>
                <div v-if="isYearly" class="text-sm text-green-600 mt-1">
                  $240/year (save $60)
                </div>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Unlimited workspaces</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Advanced AI features</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Priority support</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Version history</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Plugin marketplace access</span>
              </div>
            </div>
            
            <UButton
              block
              :loading="checkingOut === 'pro'"
              @click="startCheckout('pro')"
            >
              Start Free Trial
            </UButton>
          </div>
        </UCard>

        <!-- Enterprise Plan -->
        <UCard class="relative">
          <template #header>
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900">Enterprise</h3>
              <p class="text-gray-600 mt-2">For large organizations</p>
              <div class="mt-4">
                <span class="text-4xl font-bold text-gray-900">
                  ${{ isYearly ? '79' : '99' }}
                </span>
                <span class="text-gray-600">/month</span>
                <div v-if="isYearly" class="text-sm text-green-600 mt-1">
                  $948/year (save $240)
                </div>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Everything in Pro</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">SSO & SAML</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Advanced permissions</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">Audit logs</span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500" />
                <span class="text-sm">24/7 dedicated support</span>
              </div>
            </div>
            
            <UButton
              block
              variant="outline"
              :loading="checkingOut === 'enterprise'"
              @click="startCheckout('enterprise')"
            >
              Contact Sales
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- FAQ Section -->
      <div class="mt-20 max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        
        <div class="space-y-6">
          <UAccordion :items="faqItems" multiple />
        </div>
      </div>

      <!-- CTA Section -->
      <div class="mt-20 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Ready to transform your workflow?
        </h2>
        <p class="text-gray-600 mb-8">
          Join thousands of teams already using Athena to collaborate smarter.
        </p>
        <div class="flex justify-center gap-4">
          <UButton size="lg" @click="navigateTo('/demo')">
            Try Demo
          </UButton>
          <UButton size="lg" variant="outline" @click="startCheckout('pro')">
            Start Free Trial
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Pricing - Athena'
})

const isYearly = ref(false)
const checkingOut = ref<string | null>(null)

const faqItems = [
  {
    label: 'Can I switch plans at any time?',
    content: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.'
  },
  {
    label: 'What happens to my data if I cancel?',
    content: 'Your data remains accessible for 30 days after cancellation. You can export your data at any time during this period.'
  },
  {
    label: 'Do you offer discounts for nonprofits or education?',
    content: 'Yes! We offer special pricing for qualified nonprofit organizations and educational institutions. Contact our sales team for details.'
  },
  {
    label: 'Is there a free trial?',
    content: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start.'
  },
  {
    label: 'How does billing work for teams?',
    content: 'Billing is per workspace. You pay for the plan level of each workspace, regardless of the number of members (within plan limits).'
  }
]

async function startCheckout(plan: string) {
  checkingOut.value = plan
  
  try {
    if (plan === 'enterprise') {
      // For enterprise, redirect to contact form
      await navigateTo('/contact?plan=enterprise')
      return
    }
    
    // Redirect to demo for now since payment is disabled
    await navigateTo('/demo?plan=' + plan)
  } catch (error) {
    console.error('Navigation error:', error)
  } finally {
    checkingOut.value = null
  }
}
</script>