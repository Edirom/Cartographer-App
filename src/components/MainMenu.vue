<template>
  <div class="dropdown">
    <a class="btn btn-action btn-sm dropdown-toggle" tabindex="1" title="menu" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
      <font-awesome-icon icon="fa-solid fa-bars"/>
      <!--<font-awesome-icon icon="fa-regular fa-images"/>-->
    </a >
    <ul class="menu mainMenu">
      <li class="divider" data-content="User"></li>
        <li class="menu-item">
        <button class="btn btn-action btn-sm" @click="importXML" title="load MEI file">
          <font-awesome-icon icon="fa-solid fa-file"/> 
        </button>
        Upload MEI File
      </li>
      <li class="menu-item">
        <button class="btn btn-action btn-sm" @click="importManifest" title="import IIIF Manifest">
          <font-awesome-icon icon="fa-solid fa-circle-arrow-down"/> 
        </button>
        Import IIIF Manifest
      </li>
        <li class="menu-item">
        <button class="btn btn-action btn-sm" @click="importLocalImage" title="import Local Image">
          <font-awesome-icon icon="fa-solid fa-file-import"/> 
        </button>
        Import Local Image
      </li>
      <li class="menu-item" v-if="!isAuthenticated">
        <button class="btn btn-action btn-sm" @click="loginToGithub" title="Login with GitHub">
          <font-awesome-icon icon="fa-solid fa-user"/>
        </button>
        Login with GitHub
      </li>
      <li class="menu-item" v-if="isAuthenticated">
        <button class="btn btn-action btn-sm" @click="loadFromGithub" title="Load from GitHub">
          <font-awesome-icon icon="fa-solid fa-cloud-arrow-down"/>
        </button>
        Load from GitHub
      </li>
      <li class="menu-item">
        <template v-if="downloadAvailable">
          <a class="btn btn-action btn-sm" :href="xmlDataUrl()" target="_blank" title="download MEI file" :download="xmlFilename">
            <font-awesome-icon icon="fa-solid fa-download"/>
          </a>
          Download MEI File
        </template>
        <template v-else>
          <a class="btn btn-action btn-sm" :href="xmlDataUrl()" target="_blank" title="download MEI file" disabled :download="xmlFilename">
            <font-awesome-icon icon="fa-solid fa-download"/>
          </a>
          Download MEI File
        </template>
      </li>
      <template v-if="githubFile">
        <li class="divider" :data-content="githubBranchLabel"></li>
        <li class="menu-item">
          <button class="btn btn-action btn-sm" @click="commitToGithub" title="Commit to GitHub">
            <font-awesome-icon icon="fa-solid fa-code-commit"/>
          </button>
          Commit to GitHub
        </li>
      </template>
      <li class="divider" data-content="Actions"></li>
      <li class="menu-item">
        <button class="btn btn-action btn-sm" @click="showPagesModal" title="Show Page Overview">
          <font-awesome-icon icon="fa-regular fa-images"/>
        </button>
        Show Page Overview
      </li>
      <li class="menu-item">
        <button class="btn btn-action btn-sm" @click="toggleMeasureList" title="Toggle Measure List">
          <font-awesome-icon icon="fa-solid fa-list-ol"/>
        </button>
        Toggle Measure List
      </li>
      <template v-if="firstMeasureWithoutZone !== null">
        <li class="divider" data-content="Options"></li>
        <li class="menu-item" @click="toggleExistingMusicMode">
          <button class="btn btn-action btn-sm" title="Toggle Existing Music Mode">
            <font-awesome-icon icon="fa-solid fa-vector-square"/>
          </button>
          <span style="margin-left: .3rem;">
            <template v-if="existingMusicMode">Merge Mode On</template>
            <template v-else>Merge Mode Off</template>
          </span>
        </li>
      </template>
    </ul>

    <!-- GitHub Device Flow prompt (native/Tauri builds). Lives outside the
         dropdown list so it survives the menu closing while the user enters
         the code at github.com/login/device. Cleared automatically by the
         auth/loginDevice action on success, error, or timeout. -->
    <div v-if="devicePrompt" class="device-login-card">
      <p class="device-login-title">Sign in with GitHub</p>
      <p>Visit
        <a :href="devicePrompt.uri" target="_blank" rel="noopener">{{ devicePrompt.uri }}</a>
        and enter this code:
      </p>
      <div class="device-code-row">
        <code class="device-code">{{ devicePrompt.userCode }}</code>
        <button class="btn btn-sm" @click="copyDeviceCode" title="Copy code">
          <font-awesome-icon icon="fa-solid fa-copy"/>
        </button>
      </div>
      <p class="device-login-hint">Waiting for authorization… Only enter this code if you just requested it here.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainMenu',
  props: {
  },
  mounted () {

  },
  computed: {
    manifest: function () {
      return this.$store.getters.manifest
    },
    xmlFilename: function () {
      // TODO: Come up with better name, maybe generate from first title in file?!
      return 'meiFile.xml'
    },
    downloadAvailable: function () {
      return this.$store.getters.meiFileForDownload !== null
    },
    firstMeasureWithoutZone: function () {
      return this.$store.getters.firstMeasureWithoutZone
    },
    existingMusicMode: function () {
      return this.$store.getters.existingMusicMode
    },
    isAuthenticated: function () {
      return this.$store.getters['auth/isAuthenticated']
    },
    githubFile: function () {
      return this.$store.getters.githubFile
    },
    selectedBranch: function () {
      return this.$store.getters['auth/selectedBranch']
    },
    githubBranchLabel: function () {
      const branch = (this.githubFile && this.githubFile.branch) ||
        (this.selectedBranch && this.selectedBranch.name)
      return branch ? 'GitHub · ' + branch : 'GitHub'
    },
    devicePrompt: function () {
      return this.$store.state.auth.devicePrompt
    },
  },
  methods: {
    importXML: function () {
      this.$store.dispatch('toggleLoadXMLModal')
    },
    importManifest: function () {
      this.$store.dispatch('toggleLoadIIIFModal')
    },
    importLocalImage: function () {
      this.$store.dispatch('toggleLoadLocalImage')
    },
    loadFromGithub: function () {
      this.$store.dispatch('toggleLoadGitModal')
    },
    loginToGithub: function () {
      if (window.__TAURI_INTERNALS__) {
        this.$store.dispatch('auth/loginDevice').catch(err => {
          alert('GitHub login failed: ' + err.message)
        })
      } else {
        this.$store.dispatch('auth/login')
      }
    },
    copyDeviceCode: function () {
      if (this.devicePrompt) {
        navigator.clipboard.writeText(this.devicePrompt.userCode)
      }
    },
    commitToGithub: function () {
      this.$store.dispatch('toggleCommitModal')
    },
    getUsername: function () {
      this.$store.state.username;
    },
    xmlDataUrl () {
      const xml = this.$store.getters.meiFileForDownload
      if (xml !== null) {
        return 'data:text/xml,' + encodeURIComponent(xml)
      }
      return '#'
    },
    toggleMeasureList () {
      this.$store.dispatch('toggleMeasureList')
    },
    showPagesModal () {
      this.$store.dispatch('togglePagesModal')
    },
    toggleExistingMusicMode: function () {
      if (this.firstMeasureWithoutZone !== null) {
        this.$store.dispatch('toggleExistingMusicMode')
      }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '@/css/_variables.scss';

// This will determine the width of the menu
$gitMenuOffset: -200px;

button {
  color: $fontColorDark;
  border-color: $fontColorDark;
  margin-left: .3rem;

  svg {
    position: relative;
    top: 1px;
  }
}

.customBtn.btn.btn-link {
   text-align: left;
   margin: 0;
   padding: 0;
   border: none;
}

.mainMenu {
  width: calc( abs($gitMenuOffset) + 33px);
  left: $gitMenuOffset !important;

  color: $fontColorDark;
  font-weight: 300;
  text-align: left;

  button, a {
    position: relative;
    top: -4px;
  }

  &.menu .menu-item > a {
    display: inline;
    margin: 0 0 0 0.3rem;
    height: 28px;
    padding: .15rem .3rem;
  }

  .icon {
    font-size: .7rem;
    position: relative;
    top: -1px;
    padding-right: 5px;
  }
}

.device-login-card {
  position: fixed;
  top: 4rem;
  right: 1rem;
  z-index: 400;
  width: 280px;
  padding: .8rem;
  background: #fff;
  border: 1px solid $fontColorDark;
  border-radius: .3rem;
  box-shadow: 0 .2rem .5rem rgba(0,0,0,.2);
  color: $fontColorDark;
  text-align: left;

  .device-login-title {
    font-weight: 600;
    margin-bottom: .4rem;
  }

  .device-code-row {
    display: flex;
    align-items: center;
    gap: .4rem;
    margin: .4rem 0;
  }

  .device-code {
    font-size: 1.1rem;
    letter-spacing: .15em;
    padding: .2rem .5rem;
    background: rgba(0, 0, 0, .05);
  }

  .device-login-hint {
    font-size: .65rem;
    opacity: .75;
    margin-top: .4rem;
  }
}
</style>