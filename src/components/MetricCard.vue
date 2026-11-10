<template>
  <div class="mobile-card h-100 p-3 d-flex flex-column justify-content-between" :class="cardClass">
    <div>
      <div class="d-flex justify-content-between align-items-center mb-1">
        <small class="text-muted d-block text-xs text-truncate">{{ title }}</small>
        <ion-icon v-if="icon" :icon="icon" :class="textColorClass" style="font-size: 1.1rem; opacity: 0.8;" />
      </div>
      
      <div class="fs-6 fw-black mt-1 text-truncate" :class="textColorClass">
        {{ value }}
      </div>
    </div>

    <div v-if="subtitle || $slots.footer" class="mt-2 pt-1 border-top border-light-subtle">
      <slot name="footer">
        <small v-if="subtitle" class="text-muted d-block text-xs text-truncate">{{ subtitle }}</small>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'

const props = withDefaults(defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'indigo' | 'teal' | 'amber' | 'secondary' | 'dark'
  cardClass?: string
}>(), {
  subtitle: '',
  icon: '',
  color: 'primary',
  cardClass: ''
})

const textColorClass = computed(() => {
  if (props.color === 'indigo') return 'text-indigo'
  if (props.color === 'teal') return 'text-teal'
  if (props.color === 'amber') return 'text-amber'
  return `text-${props.color}`
})
</script>

