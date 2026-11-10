<template>
  <div class="empty-state text-center py-5 px-3" :class="[card ? 'mobile-card container-padded mx-2 my-2' : '']">
    <div v-if="icon" class="empty-icon-wrap mb-3 text-muted">
      <ion-icon :icon="icon" style="font-size: 3.25rem; opacity: 0.65;" />
    </div>

    <h6 v-if="title" class="fw-bold text-dark mb-1">{{ title }}</h6>
    <p class="text-muted small mb-0 mx-auto" style="max-width: 420px;">
      {{ message }}
    </p>

    <!-- Optional Slot or Action Button -->
    <div v-if="$slots.default || actionText" class="mt-3">
      <slot>
        <button
          v-if="actionText"
          type="button"
          class="btn btn-action btn-sm"
          :class="actionVariant"
          @click="$emit('action')"
        >
          <ion-icon v-if="actionIcon" :icon="actionIcon" class="me-1" />
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'

withDefaults(defineProps<{
  icon?: string
  title?: string
  message?: string
  card?: boolean
  actionText?: string
  actionIcon?: string
  actionVariant?: string
}>(), {
  icon: '',
  title: '',
  message: 'Tidak ada data yang ditemukan.',
  card: false,
  actionText: '',
  actionIcon: '',
  actionVariant: 'primary'
})

defineEmits<{
  (e: 'action'): void
}>()
</script>

