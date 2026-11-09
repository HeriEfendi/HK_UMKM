<template>
  <ion-toast
    :is-open="isOpen"
    :message="message"
    :class="toastClass"
    :style="{
      '--background': bgColor,
      '--color': '#fff',
      '--border-radius': '16px',
      '--box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
      '--min-height': '60px'
    }"
    position="top"
    duration="3500"
    @didDismiss="$emit('dismiss')"
  >
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
      <ion-icon :icon="toastIcon" style="font-size: 24px;" />
      <span>{{ message }}</span>
    </div>
  </ion-toast>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonToast, IonIcon } from '@ionic/vue';
import { checkmarkCircleOutline, closeCircleOutline, warningOutline, informationCircleOutline } from 'ionicons/icons';

const props = defineProps<{
  isOpen: boolean;
  message: string;
  color?: 'success' | 'error' | 'danger' | 'warning' | 'info' | string;
}>();

defineEmits(['dismiss']);

const bgColor = computed(() => {
  if (props.color === 'success') return '#10b981';
  if (props.color === 'warning') return '#f59e0b';
  if (props.color === 'info') return '#3b82f6';
  return '#ef4444';
});

const toastClass = computed(() => {
  if (props.color === 'success') return 'toast-success';
  if (props.color === 'warning') return 'toast-warning';
  return 'toast-error';
});

const toastIcon = computed(() => {
  if (props.color === 'success') return checkmarkCircleOutline;
  if (props.color === 'warning') return warningOutline;
  if (props.color === 'info') return informationCircleOutline;
  return closeCircleOutline;
});
</script>
