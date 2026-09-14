<template>
  <header class="navbar appHeader">
    <section class="navbar-section">
      <span class="navbar-brand mr-2">cartographer-app</span>
    </section>
    <section class="navbar-section">
      <template v-if="isAuthenticated">
        <!-- Profile dropdown -->
        <div class="dropdown dropdown-right gh-user-dropdown" :class="{ active: menuOpen }">
          <a
            class="dropdown-toggle gh-profile-toggle"
            tabindex="0"
            @click.prevent="menuOpen = !menuOpen"
            @keydown.enter.prevent="menuOpen = !menuOpen"
          >
            <img
              v-if="user && user.avatar_url"
              :src="user.avatar_url"
              class="gh-avatar"
              :alt="user.login"
            />
            <span class="gh-username ml-1">{{ user && user.login }}</span>
            <i class="icon icon-caret ml-1"></i>
          </a>
          <ul class="menu" @mousedown.prevent>
            <li class="menu-item menu-item-static">
              <div class="tile tile-centered">
                <div class="tile-icon">
                  <img
                    v-if="user && user.avatar_url"
                    :src="user.avatar_url"
                    class="gh-avatar-lg"
                    :alt="user.login"
                  />
                </div>
                <div class="tile-content">
                  <div class="tile-title">{{ user && user.name }}</div>
                  <div class="tile-subtitle text-gray">{{ user && user.login }}</div>
                </div>
              </div>
            </li>
            <li class="divider"></li>
            <li class="menu-item">
              <a href="#" @click.prevent="logout">
                <font-awesome-icon icon="fa-solid fa-user" class="mr-1" /> Sign out
              </a>
            </li>
          </ul>
        </div>
      </template>
      <div class="input-group input-inline">
        <div class="button-group">
          <MainMenu/>
        </div>
      </div>
    </section>
  </header>
</template>

<script>
import MainMenu from '@/components/MainMenu.vue'

export default {
  name: 'AppHeader',
  components: { MainMenu },
  data () {
    return { menuOpen: false }
  },
  computed: {
    isAuthenticated () { return this.$store.getters['auth/isAuthenticated'] },
    user ()            { return this.$store.getters['auth/user'] },
  },
  mounted () {
    // Close dropdown when clicking anywhere outside
    document.addEventListener('click', this.handleOutsideClick)
  },
  beforeUnmount () {
    document.removeEventListener('click', this.handleOutsideClick)
  },
  methods: {
    logout () {
      this.menuOpen = false
      this.$store.dispatch('auth/logout')
      this.$store.dispatch('notifications/notify', {
        message: 'You have been signed out.',
        type: 'success',
      })
    },
    handleOutsideClick (e) {
      if (!this.$el.contains(e.target)) this.menuOpen = false
    },
  },
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.appHeader {
  height: calc(#{$appHeaderHeight} + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  background-color: $appColor;
  border-bottom: $thickBorder;
  box-sizing: border-box;

  .navbar-brand {
    padding-left: 1rem;
  }

  .button-group {
    padding-right: 0.4rem;

    a, button {
      color: $fontColorDark;
      border-color: $fontColorDark;
      margin-left: .3rem;
    }
  }

  .gh-user-dropdown {
    position: relative;
    margin-right: 0.5rem;

    .gh-profile-toggle {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      color: $fontColorDark;
      text-decoration: none;

      &:hover { background: rgba(255,255,255,0.15); }
    }

    .menu {
      min-width: 180px;
      right: 0;
      left: auto;
      top: 100%;

      .gh-avatar-lg {
        width: 36px;
        height: 36px;
        border-radius: 50%;
      }
    }
  }

  .gh-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    vertical-align: middle;
  }

  .gh-username {
    font-size: 0.75rem;
    vertical-align: middle;
  }

  .btn-primary {
    color: white;
    border-color: white;
  }
}

// Small screens (phones): shrink the brand so it fits the header height and
// leaves room for the menu button.
@media (max-width: 599px) {
  .appHeader {
    .navbar-brand {
      padding-left: .5rem;
      font-size: .95rem;
      white-space: nowrap;
    }
  }
}
</style>
