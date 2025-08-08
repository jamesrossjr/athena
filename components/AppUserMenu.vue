<template>
  <UDropdown :items="items" :popper="{ placement: 'bottom-end' }">
    <UAvatar
      src="https://avatars.githubusercontent.com/u/1?v=4"
      alt="User"
      size="sm"
      class="cursor-pointer"
    />
  </UDropdown>
</template>

<script setup>
const items = [
  [{
    label: 'Profile',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/profile')
  }],
  [{
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => navigateTo('/settings')
  }, {
    label: 'Help',
    icon: 'i-heroicons-question-mark-circle'
  }],
  [{
    label: 'Sign out',
    icon: 'i-heroicons-arrow-right-on-rectangle'
  }]
]
</script>