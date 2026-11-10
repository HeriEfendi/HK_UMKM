<template>
  <div class="app-input-group mb-3" :class="{ 'has-error': !!error }">
    <label v-if="label" class="form-label mb-1 fw-semibold small d-flex align-items-center justify-content-between">
      <span>
        {{ label }}
        <span v-if="required" class="text-danger ms-1">*</span>
      </span>
      <span v-if="hintRight" class="text-muted fw-normal" style="font-size: 0.75rem;">{{ hintRight }}</span>
    </label>

    <div class="position-relative d-flex align-items-center w-100">
      <ion-icon
        v-if="icon"
        :icon="icon"
        class="position-absolute text-muted"
        style="left: 12px; font-size: 1.1rem; pointer-events: none; z-index: 4;"
      />

      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
        :readonly="readonly"
        class="form-control app-control"
        :class="[
          sizeClass,
          { 'is-invalid': !!error },
          icon ? 'ps-5' : ''
        ]"
        @input="onInput"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      ></textarea>

      <input
        v-else
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        class="form-control app-control"
        :class="[
          sizeClass,
          { 'is-invalid': !!error },
          icon ? 'ps-5' : ''
        ]"
        @input="onInput"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />

      <button
        v-if="clearable && modelValue"
        type="button"
        class="btn btn-link p-0 position-absolute text-muted text-decoration-none"
        style="right: 12px; z-index: 4;"
        @click="clear"
      >
        <ion-icon :icon="closeCircleOutline" style="font-size: 1.1rem;" />
      </button>
    </div>

    <div v-if="error" class="text-danger mt-1 d-flex align-items-center gap-1" style="font-size: 0.75rem;">
      <ion-icon :icon="alertCircleOutline" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="hint" class="text-muted mt-1" style="font-size: 0.75rem;">
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { closeCircleOutline, alertCircleOutline } from 'ionicons/icons'

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: string
  hint?: string
  hintRight?: string
  icon?: string
  clearable?: boolean
  rows?: number
  size?: 'sm' | 'md' | 'lg'
  min?: string | number
  max?: string | number
  step?: string | number
}>(), {
  modelValue: '',
  label: '',
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
  readonly: false,
  error: '',
  hint: '',
  hintRight: '',
  icon: '',
  clearable: false,
  rows: 3,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'clear'): void
}>()

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'form-control-sm'
  if (props.size === 'lg') return 'form-control-lg'
  return ''
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const clear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

