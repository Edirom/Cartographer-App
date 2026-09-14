<template>
  <div class="app-notifications">
    <transition-group name="toast-fade" tag="div">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="toast notification-toast"
        :class="toastClass(n.type)"
        role="status"
        aria-live="polite"
      >
        <button
          class="btn btn-clear float-right"
          aria-label="Dismiss"
          @click="dismiss(n.id)"
        ></button>
        {{ n.message }}
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'AppNotifications',
  computed: {
    notifications () {
      return this.$store.getters['notifications/notifications']
    },
  },
  methods: {
    toastClass (type) {
      switch (type) {
        case 'success': return 'toast-success'
        case 'error':   return 'toast-error'
        case 'warning': return 'toast-warning'
        default:        return 'toast-primary'
      }
    },
    dismiss (id) {
      this.$store.dispatch('notifications/dismiss', id)
    },
  },
}
</script>

<style scoped lang="scss">
.app-notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  width: 320px;
  max-width: calc(100vw - 2rem);
  pointer-events: none;
}

.notification-toast {
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  word-break: break-word;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
