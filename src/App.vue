
<template>
  <div>
    <router-view></router-view>
    <AppNotifications/>
  </div>
</template>

<script>
import AppNotifications from '@/components/AppNotifications.vue'

export default {
  name: 'App',
  components: { AppNotifications },
}
</script>