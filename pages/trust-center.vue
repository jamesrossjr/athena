<template>
  <div>
    <Head>
      <Title>Trust Center - Athena</Title>
      <Meta name="description" content="Athena Trust Center - Transparency, Security, and Governance information" />
    </Head>
    
    <TrustCenter />
  </div>
</template>

<script setup>
// Import the trust center component
import TrustCenter from '~/components/governance/TrustCenter.vue'

// This page is publicly accessible without authentication
definePageMeta({
  layout: 'default',
  auth: false // Public trust center
})
</script>