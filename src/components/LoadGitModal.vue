<template>
  <div class="modal active">
    <a href="#close" class="modal-overlay" aria-label="Close" @click.prevent="closeModal"></a>
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-header">
        <button class="btn btn-clear float-right" aria-label="Close" @click="closeModal"></button>
        <div class="modal-title h5">
          <font-awesome-icon icon="fa-solid fa-cloud-arrow-down" class="mr-1" />
          Load from GitHub
        </div>
      </div>

      <div class="modal-body">
        <!-- ── Mode toggle ── -->
        <div class="btn-group btn-group-block mode-toggle" style="margin-bottom: 0.8rem;">
          <button
            class="btn btn-sm"
            :class="mode === 'mei' ? 'btn-primary' : ''"
            @click="mode = 'mei'"
          >
            <font-awesome-icon icon="fa-solid fa-file" class="mr-1" /> Load MEI
          </button>
          <button
            class="btn btn-sm"
            :class="mode === 'images' ? 'btn-primary' : ''"
            @click="mode = 'images'"
          >
            <font-awesome-icon icon="fa-regular fa-images" class="mr-1" /> Import Images
          </button>
        </div>
        <p v-if="mode === 'images'" class="text-gray text-small" style="margin-bottom:0.6rem;">
          Navigate to the folder containing images, then click Import Images.
        </p>
        <!-- ── Repository picker ── -->
        <div v-if="!currentRepo">
          <div v-if="loadingRepos" class="text-center" style="padding: 2rem;">
            <div class="loading loading-lg"></div>
          </div>
          <template v-else>
            <div class="form-group">
              <input
                ref="repoFilterInput"
                class="form-input"
                v-model="repoFilter"
                placeholder="Filter repositories…"
              />
            </div>
            <div v-if="filteredRepos.length === 0" class="empty">
              <p class="empty-subtitle text-gray">No repositories found.</p>
            </div>
            <ul v-else class="menu" style="max-height: 300px; overflow-y: auto;">
              <li
                v-for="repo in filteredRepos"
                :key="repo.full_name"
                class="menu-item"
              >
                <a href="#" @click.prevent="selectRepo(repo)">
                  <span
                    class="label label-rounded mr-1"
                    :class="repo.private ? 'label-warning' : 'label-success'"
                  >
                    {{ repo.private ? 'private' : 'public' }}
                  </span>
                  {{ repo.full_name }}
                </a>
              </li>
            </ul>
          </template>
        </div>

        <!-- ── Branch picker ── -->
        <div v-else-if="!selectedBranch">
          <div class="file-browser-header" style="margin-bottom: 0.6rem;">
            <button class="btn btn-sm" @click="backToRepos">← Repos</button>
            <span class="text-bold ml-2">{{ currentRepo.full_name }}</span>
          </div>
          <div v-if="loadingBranches" class="text-center" style="padding: 2rem;">
            <div class="loading loading-lg"></div>
          </div>
          <template v-else>
            <div class="form-group">
              <input
                class="form-input"
                v-model="branchFilter"
                placeholder="Filter branches…"
              />
            </div>
            <div v-if="filteredBranches.length === 0" class="empty">
              <p class="empty-subtitle text-gray">No branches found.</p>
            </div>
            <ul v-else class="menu" style="max-height: 300px; overflow-y: auto;">
              <li
                v-for="branch in filteredBranches"
                :key="branch.name"
                class="menu-item"
              >
                <a href="#" @click.prevent="selectBranch(branch)">
                  <font-awesome-icon icon="fa-solid fa-code-branch" class="mr-1" />
                  {{ branch.name }}
                </a>
              </li>
            </ul>
          </template>
        </div>

        <!-- ── File browser ── -->
        <div v-else>
          <div class="file-browser-header">
            <button class="btn btn-sm" @click="backToBranches">← Branches</button>
            <span class="text-bold ml-2">{{ currentRepo.name }} / {{ selectedBranch.name }}</span>
          </div>

          <!-- Breadcrumb -->
          <ul class="breadcrumb" style="font-size: 0.75rem; margin: 0.4rem 0;">
            <li class="breadcrumb-item">
              <a href="#" @click.prevent="navigateTo('')">root</a>
            </li>
            <li
              v-for="(part, i) in pathParts"
              :key="i"
              class="breadcrumb-item"
            >
              <a href="#" @click.prevent="navigateTo(pathUpTo(i))">{{ part }}</a>
            </li>
          </ul>

          <div v-if="loadingContents" class="text-center" style="padding: 1rem;">
            <div class="loading loading-lg"></div>
          </div>
          <ul v-else class="menu" style="max-height: 270px; overflow-y: auto;">
            <li v-if="currentPath !== ''" class="menu-item">
              <a href="#" @click.prevent="navigateUp">
                <span class="icon icon-arrow-left mr-1"></span> ..
              </a>
            </li>
            <li
              v-for="item in contents"
              :key="item.path"
              class="menu-item"
              :class="{ active: selectedFile && selectedFile.path === item.path }"
            >
              <a
                href="#"
                @click.prevent="handleItemClick(item)"
                :class="{ 'text-gray': item.type === 'file' && mode === 'mei' && !isLoadable(item) }"
                :title="item.type === 'file' && mode === 'mei' && !isLoadable(item) ? 'Only .xml and .mei files can be loaded' : ''"
              >
                <span class="mr-1">{{ item.type === 'dir' ? '📁' : '📄' }}</span>
                {{ item.name }}
              </a>
            </li>
          </ul>

          <p v-if="mode === 'images' && hasImagesInCurrentFolder" class="text-small text-success" style="margin-top: 0.4rem;">
            ✓ Found <strong>{{ imageCountInCurrentFolder }}</strong> image(s) ready to import.
          </p>
          <p v-if="selectedFile && mode === 'mei'" class="text-small text-success" style="margin-top: 0.4rem;">
            ✓ Selected: <strong>{{ selectedFile.name }}</strong>
          </p>
          <p v-if="loadError" class="text-small text-error" style="margin-top: 0.4rem;">
            {{ loadError }}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="closeModal">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="(mode === 'mei' ? !selectedFile : !hasImagesInCurrentFolder) || importing"
          :class="{ loading: importing }"
          @click="mode === 'mei' ? loadSelectedFile() : importImagesFromFolder()"
        >
          {{ mode === 'mei' ? 'Load MEI' : 'Import Images' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadGitModal',
  data () {
    return {
      repoFilter: '',
      branchFilter: '',
      importing: false,
      loadError: null,
      mode: 'mei',   // 'mei' | 'images'
    }
  },
  computed: {
    currentRepo ()      { return this.$store.getters['auth/selectedRepo'] },
    loadingRepos ()     { return this.$store.getters['auth/loadingRepos'] },
    loadingContents ()  { return this.$store.getters['auth/loadingContents'] },
    repos ()            { return this.$store.getters['auth/repos'] },
    contents ()         { return this.$store.getters['auth/repoContents'] },
    currentPath ()      { return this.$store.getters['auth/currentRepoPath'] },
    selectedFile ()     { return this.$store.getters['auth/selectedFile'] },
    branches ()         { return this.$store.getters['auth/branches'] },
    selectedBranch ()   { return this.$store.getters['auth/selectedBranch'] },
    loadingBranches ()  { return this.$store.getters['auth/loadingBranches'] },
    filteredRepos () {
      const f = this.repoFilter.toLowerCase().trim()
      return f ? this.repos.filter(r => r.full_name.toLowerCase().includes(f)) : this.repos
    },
    filteredBranches () {
      const f = this.branchFilter.toLowerCase().trim()
      return f ? this.branches.filter(b => b.name.toLowerCase().includes(f)) : this.branches
    },
    pathParts () {
      return this.currentPath ? this.currentPath.split('/') : []
    },
    hasImagesInCurrentFolder () {
      const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i
      return this.contents.some(item => item.type === 'file' && IMAGE_RE.test(item.name))
    },
    imageCountInCurrentFolder () {
      const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i
      return this.contents.filter(item => item.type === 'file' && IMAGE_RE.test(item.name)).length
    },
  },
  async mounted () {
    if (this.repos.length === 0) {
      await this.$store.dispatch('auth/fetchRepos')
    }
    this.$nextTick(() => {
      if (this.$refs.repoFilterInput) this.$refs.repoFilterInput.focus()
    })
  },
  methods: {
    closeModal () {
      this.$store.dispatch('toggleLoadGitModal')
    },
    async selectRepo (repo) {
      await this.$store.dispatch('auth/selectRepo', repo)
    },
    backToRepos () {
      this.$store.dispatch('auth/clearSelectedRepo')
    },
    backToBranches () {
      this.$store.dispatch('auth/clearSelectedBranch')
    },
    selectBranch (branch) {
      this.$store.dispatch('auth/selectBranch', branch)
    },
    navigateTo (path) {
      this.$store.dispatch('auth/fetchRepoContents', { repo: this.currentRepo, path })
    },
    navigateUp () {
      const parts = this.currentPath.split('/')
      parts.pop()
      this.navigateTo(parts.join('/'))
    },
    pathUpTo (i) {
      return this.pathParts.slice(0, i + 1).join('/')
    },
    isLoadable (item) {
      return this.mode === 'mei' && item.type === 'file' &&
        (item.name.endsWith('.xml') || item.name.endsWith('.mei'))
    },
    handleItemClick (item) {
      if (item.type === 'dir') {
        this.navigateTo(item.path)
      } else if (this.isLoadable(item)) {
        this.$store.dispatch('auth/selectFile', item)
        this.loadError = null
      }
    },
    async loadSelectedFile () {
      this.loadError = null
      this.importing = true
      try {
        await this.$store.dispatch('loadFileFromGithub')
      } catch (err) {
        this.loadError = err.message || 'Failed to load file from GitHub.'
      } finally {
        this.importing = false
      }
    },
    async importImagesFromFolder () {
      this.loadError = null
      this.importing = true
      try {
        await this.$store.dispatch('loadImagesFromGithub')
      } catch (err) {
        this.loadError = err.message || 'Failed to import images.'
      } finally {
        this.importing = false
      }
    },
  },
}
</script>

<style scoped lang="scss">
.modal-container .modal-body {
  padding: 0 0.8rem;
}
.modal-container .modal-footer {
  padding: 0 0.8rem 0.8rem;
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}
.file-browser-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.4rem;
}
.menu .menu-item a {
  display: flex;
  align-items: center;
}
</style>
