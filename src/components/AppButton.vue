<template>
  <button
    :type="type"
    class="btn d-inline-flex align-items-center justify-content-center gap-1"
    :class="[
      computedVariantClass,
      sizeClass,
      { 'rounded-pill': pill, 'w-100': block }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <ion-spinner v-if="loading" name="crescent" style="width: 16px; height: 16px;" class="me-1" />
    <ion-icon v-else-if="icon" :icon="icon" class="flex-shrink-0" />
    
    <span v-if="$slots.default">
      <slot />
    </span>

    <ion-icon v-if="iconEnd && !loading" :icon="iconEnd" class="flex-shrink-0 ms-1" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon, IonSpinner } from '@ionic/vue'

const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'light' | 'danger' | 'success' | 'warning' | 'info' | 'teal' | 'outline-primary' | 'outline-secondary' | 'outline-danger' | 'outline-success'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconEnd?: string
  loading?: boolean
  disabled?: boolean
  pill?: boolean
  block?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  icon: '',
  iconEnd: '',
  loading: false,
  disabled: false,
  pill: false,
  block: false
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const computedVariantClass = computed(() => {
  if (props.variant.startsWith('outline-')) {
    return `btn-${props.variant}`
  }
  // Standard project button styles
  return `btn-action ${props.variant}`
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'btn-sm'
  if (props.size === 'lg') return 'btn-lg'
  return 'btn-md'
})
</script>

