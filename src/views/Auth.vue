<template>
  <div class="auth-callback">
    <div v-if="error" class="toast toast-error" style="max-width: 480px;">
      <font-awesome-icon icon="fa-solid fa-user" class="mr-1" />
      Authentication failed: {{ error }}
      <router-link :to="{ name: 'home' }" class="btn btn-link ml-2">Go home</router-link>
    </div>
    <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
      <div class="loading loading-lg"></div>
      <span>Authenticating with GitHub…</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthCallback',
  data: () => ({ error: null }),
  async mounted () {
    const code = this.$route.query.code
    const state = this.$route.query.state
    // GitHub redirects back with error/error_description when the user cancels
    // or denies authorization (e.g. error=access_denied).
    const oauthError = this.$route.query.error
    if (oauthError) {
      const message = oauthError === 'access_denied'
        ? 'Login was cancelled. You are not signed in.'
        : (this.$route.query.error_description || `Login failed: ${oauthError}`)
      this.recover(message, 'warning')
      return
    }
    if (!code) {
      this.recover('No authorization code received from GitHub. Please try signing in again.', 'error')
      return
    }
    if (!state) {
      this.recover('Missing OAuth state; the login could not be validated. Please try again.', 'error')
      return
    }
    const expectedState = sessionStorage.getItem('gh_oauth_state')
    sessionStorage.removeItem('gh_oauth_state')
    if (!expectedState || state !== expectedState) {
      this.recover('OAuth state mismatch. Possible CSRF attempt or expired login session. Please try again.', 'error')
      return
    }
    try {
      await this.$store.dispatch('auth/authenticate', { code, state })
      this.$store.dispatch('notifications/notify', {
        message: 'Signed in to GitHub successfully.',
        type: 'success',
      })
      this.$router.push('/')
    } catch (e) {
      const msg = e.message || ''
      const isNetwork = msg.toLowerCase().includes('failed to fetch') ||
                        msg.toLowerCase().includes('networkerror') ||
                        msg.toLowerCase().includes('load failed')
      this.recover(isNetwork
        ? 'Cannot reach GitHub to complete authentication. Check your network connection and try again.'
        : (msg || 'Authentication failed. Please try again.'), 'error')
    }
  },
  methods: {
    // Show feedback and return to the app so it stays usable after a failed login.
    recover (message, type) {
      this.error = message
      this.$store.dispatch('notifications/notify', { message, type })
      this.$router.push('/')
    },
  },
}
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
