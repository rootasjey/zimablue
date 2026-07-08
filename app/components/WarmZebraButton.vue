<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'sm'
  iconOnly?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  iconOnly: false,
})
</script>

<template>
  <button class="btn" :class="[variant, size, { 'icon-only': iconOnly }]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  --amber: #FAB12F;
  --coral: #FF6B6B;
  --indigo: #6366F1;
  --indigo-deep: #312E81;

  padding: 0.75em 1.5em;
  background: none;
  border: 2px solid #fff;
  font-size: 0.9375rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  border-radius: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: inherit;
  line-height: 1;
}

.btn {
  color: #1a1a1a;
  background-color: var(--amber);
  box-shadow: 0 2px 0 2px #000;
}

.btn::before {
  content: "";
  position: absolute;
  width: 100px;
  height: 120%;
  background-color: var(--coral);
  top: 50%;
  transform: skewX(30deg) translate(-150%, -50%);
  transition: all 0.5s;
}

.btn:hover {
  background-color: var(--indigo);
  color: #fff;
  box-shadow: 0 2px 0 2px var(--indigo-deep);
}

.btn:hover::before {
  transform: skewX(30deg) translate(150%, -50%);
  transition-delay: 0.1s;
}

.btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 0 transparent;
}

.btn.secondary {
  color: #555;
  background-color: #e5e5e5;
  border-color: #d4d4d4;
  box-shadow: 0 2px 0 2px #aaa;
}

.btn.secondary::before {
  display: none;
}

.btn.secondary:hover {
  background-color: #d4d4d4;
  color: #333;
  box-shadow: 0 2px 0 2px #888;
}

.btn.secondary:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 0 transparent;
}

.btn.sm {
  font-size: 0.75rem;
  border-radius: 10px;
}

.btn.icon-only {
  padding: 0;
  width: 2.25rem;
  height: 2.25rem;
  justify-content: center;
}

.btn.sm.icon-only {
  width: 2rem;
  height: 2rem;
}

@media (prefers-color-scheme: dark) {
  .btn {
    border-color: #2a2a2a;
    box-shadow: 0 2px 0 2px #1a1a1a;
  }

  .btn:hover {
    box-shadow: 0 2px 0 2px #1e1b4b;
  }

  .btn.secondary {
    color: #aaa;
    background-color: #2a2a2a;
    border-color: #333;
    box-shadow: 0 2px 0 2px #111;
  }

  .btn.secondary:hover {
    background-color: #333;
    color: #ddd;
    box-shadow: 0 2px 0 2px #222;
  }
}
</style>
