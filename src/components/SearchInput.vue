<template>
  <div class="search-input-wrapper position-relative w-100">
    <ion-icon 
      :icon="searchOutline" 
      class="search-leading-icon position-absolute top-50 start-0 translate-middle-y ms-2 text-muted pe-none"
    />
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="form-control app-control"
      :class="[sizeClass, inputClass]"
      style="padding-left: 2rem; padding-right: 2rem;"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="btn-clear-input position-absolute top-50 end-0 translate-middle-y me-2 btn btn-link p-0 text-muted border-0 shadow-none d-flex align-items-center justify-content-center"
      style="width: 24px; height: 24px; text-decoration: none;"
      @click="onClear"
      title="Hapus pencarian"
    >
      <ion-icon :icon="closeCircleOutline" style="font-size: 1.1rem;" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { searchOutline, closeCircleOutline } from 'ionicons/icons'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  inputClass?: string
}>(), {
  modelValue: '',
  placeholder: 'Cari data...',
  disabled: false,
  size: 'sm',
  inputClass: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'form-control-sm'
  if (props.size === 'lg') return 'form-control-lg'
  return ''
})

const onClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}
</script>

