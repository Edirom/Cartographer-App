<template>
  <div class="modal active">
    <a href="#close" class="modal-overlay" aria-label="Close" @click.prevent="closeModal"></a>
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-header">
        <button class="btn btn-clear float-right" aria-label="Close" @click="closeModal"></button>
        <div class="modal-title h5">
          <font-awesome-icon icon="fa-solid fa-code-commit" class="mr-1" />
          Commit to GitHub
        </div>
      </div>

      <div class="modal-body">
        <!-- Conflict alert -->
        <div v-if="isConflict" class="toast toast-error" style="margin-bottom: 0.8rem;">
          <strong>Conflict detected.</strong> The file on GitHub was modified after you loaded it.
          Try switching to a different branch, creating a new branch, or renaming the file, then commit again.
        </div>

        <!-- General error -->
        <div v-else-if="errorMsg" class="toast toast-error" style="margin-bottom: 0.8rem;">
          {{ errorMsg }}
        </div>

        <div>
          <!-- Current target summary -->
          <div class="commit-target-summary text-small text-gray">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            <strong>{{ effectiveRepo }}</strong>
            <template v-if="effectiveBranch"> @ <code>{{ effectiveBranch }}</code></template>
            → <code>{{ effectivePath }}</code>
          </div>
          <!-- Toggle: different repository -->
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="changeRepo" @change="onChangeRepoToggle" :disabled="committing" />
              <i class="form-icon"></i> Commit to a different repository
            </label>
            <select
              v-if="changeRepo"
              class="form-select"
              v-model="selectedRepoFull"
              style="margin-top: 0.4rem;"
              :disabled="committing"
              @change="onSelectedRepoChange"
            >
              <option value="">— select repository —</option>
              <option v-for="r in repos" :key="r.full_name" :value="r.full_name">
                {{ r.full_name }}
              </option>
            </select>
          </div>

          <!-- Toggle: different branch -->
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="changeBranch" @change="onChangeBranchToggle" :disabled="committing" />
              <i class="form-icon"></i> Commit to a different branch
            </label>
            <div v-if="changeBranch" style="margin-top: 0.4rem;">
              <!-- Existing vs new sub-toggle -->
              <div class="btn-group btn-group-block" style="margin-bottom: 0.4rem;">
                <button
                  class="btn btn-sm"
                  :class="branchMode === 'existing' ? 'btn-primary' : ''"
                  @click="branchMode = 'existing'"
                  :disabled="committing"
                >Existing branch</button>
                <button
                  class="btn btn-sm"
                  :class="branchMode === 'new' ? 'btn-primary' : ''"
                  @click="branchMode = 'new'"
                  :disabled="committing"
                >Create new branch</button>
              </div>
              <!-- Existing branch dropdown -->
              <div v-if="branchMode === 'existing'">
                <div v-if="loadingBranches" class="text-gray text-small">Loading branches…</div>
                <select v-else class="form-select" v-model="selectedBranch" :disabled="committing">
                  <option value="">— select branch —</option>
                  <option v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</option>
                </select>
              </div>
              <!-- New branch name input -->
              <div v-else>
                <input
                  class="form-input"
                  v-model="newBranchName"
                  placeholder="new-branch-name"
                  :disabled="committing"
                />
                <p class="text-small text-gray" style="margin-top: 0.2rem;">
                  <template v-if="changeRepo && selectedRepoFull">
                    Will be created in <code>{{ selectedRepoFull }}</code> from its default branch
                    (the base branch is resolved automatically).
                  </template>
                  <template v-else>
                    Will be created from
                    <code>{{ githubFile ? (githubFile.branch || 'default branch') : 'default branch' }}</code>
                  </template>
                </p>
              </div>
            </div>
          </div>

          <!-- Toggle: different path / name -->
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="changePath" @change="onChangePathToggle" :disabled="committing" />
              <i class="form-icon"></i> Change file path / name
            </label>
            <input
              v-if="changePath"
              class="form-input"
              v-model="customPath"
              style="margin-top: 0.4rem;"
              placeholder="path/to/file.mei"
              :disabled="committing"
            />
          </div>

          <!-- Commit message -->
          <div class="form-group" style="margin-top: 0.6rem;">
            <label class="form-label" for="commit-message">Commit message</label>
            <textarea
              id="commit-message"
              class="form-input"
              v-model="commitMessage"
              rows="3"
              placeholder="Update MEI file via Cartographer"
              :disabled="committing"
              style="resize: vertical;"
              ref="messageInput"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn" @click="closeModal">Cancel</button>
        <button
          class="btn btn-primary"
          :disabled="!canCommit || committing"
          :class="{ loading: committing }"
          @click="doCommit"
        >
          Commit
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommitModal',
  data () {
    return {
      commitMessage: 'Update MEI file via Cartographer',
      changeRepo: false,
      selectedRepoFull: '',
      changeBranch: false,
      branchMode: 'existing',   // 'existing' | 'new'
      selectedBranch: '',
      newBranchName: '',
      changePath: false,
      customPath: '',
      committing: false,
      errorMsg: null,
      isConflict: false,
    }
  },
  computed: {
    githubFile ()      { return this.$store.getters.githubFile },
    repos ()           { return this.$store.getters['auth/repos'] },
    branches ()        { return this.$store.getters['auth/branches'] },
    loadingBranches () { return this.$store.getters['auth/loadingBranches'] },
    effectiveRepo () {
      if (this.changeRepo && this.selectedRepoFull) return this.selectedRepoFull
      return this.githubFile ? `${this.githubFile.owner}/${this.githubFile.repo}` : '—'
    },
    effectiveBranch () {
      if (this.changeBranch) {
        if (this.branchMode === 'new' && this.newBranchName.trim()) return `${this.newBranchName.trim()} (new)`
        if (this.branchMode === 'existing' && this.selectedBranch) return this.selectedBranch
      }
      return this.githubFile ? (this.githubFile.branch || '') : ''
    },
    effectivePath () {
      if (this.changePath && this.customPath.trim()) return this.customPath.trim()
      return this.githubFile ? this.githubFile.path : ''
    },
    canCommit () {
      if (!this.commitMessage.trim()) return false
      if (this.changeRepo && !this.selectedRepoFull) return false
      if (this.changeBranch) {
        if (this.branchMode === 'existing' && !this.selectedBranch) return false
        if (this.branchMode === 'new' && !this.newBranchName.trim()) return false
      }
      if (this.changePath && !this.customPath.trim()) return false
      return true
    },
  },
  async mounted () {
    // Pre-fetch branches for the loaded repo so the dropdown is ready when toggled
    if (this.githubFile && this.branches.length === 0) {
      await this.$store.dispatch('auth/fetchBranches', {
        owner: this.githubFile.owner,
        name: this.githubFile.repo,
      })
    }
    this.$nextTick(() => {
      if (this.$refs.messageInput) this.$refs.messageInput.focus()
    })
  },
  methods: {
    closeModal () {
      this.$store.dispatch('toggleCommitModal')
    },

    onChangeRepoToggle () {
      if (!this.changeRepo) {
        this.selectedRepoFull = ''
        // If branch override is on, refetch branches for the original repo
        if (this.changeBranch && this.githubFile) {
          this.selectedBranch = ''
          this.$store.dispatch('auth/fetchBranches', {
            owner: this.githubFile.owner,
            name: this.githubFile.repo,
          })
        }
      }
    },

    onSelectedRepoChange () {
      // When a different repo is picked, refresh branch list if branch override is on
      if (this.changeBranch && this.selectedRepoFull) {
        const found = this.repos.find(r => r.full_name === this.selectedRepoFull)
        if (found) {
          this.selectedBranch = ''
          this.$store.dispatch('auth/fetchBranches', { owner: found.owner, name: found.name })
        }
      }
    },

    onChangeBranchToggle () {
      if (this.changeBranch) {
        this.branchMode = 'existing'
        // Fetch branches for whichever repo is currently effective
        let repoObj
        if (this.changeRepo && this.selectedRepoFull) {
          repoObj = this.repos.find(r => r.full_name === this.selectedRepoFull)
        } else if (this.githubFile) {
          repoObj = { owner: this.githubFile.owner, name: this.githubFile.repo }
        }
        if (repoObj) this.$store.dispatch('auth/fetchBranches', repoObj)
      } else {
        this.selectedBranch = ''
        this.newBranchName  = ''
        this.branchMode     = 'existing'
      }
    },

    resolveWithBranch () {
      this.isConflict  = false
      this.changeBranch = true
      this.branchMode  = 'existing'
      this.onChangeBranchToggle()
    },

    resolveWithNewBranch () {
      this.isConflict   = false
      this.changeBranch = true
      this.branchMode   = 'new'
    },

    resolveWithRename () {
      this.isConflict = false
      this.changePath = true
      if (this.githubFile) this.customPath = this.githubFile.path
    },

    onChangePathToggle () {
      if (this.changePath && this.githubFile) {
        this.customPath = this.githubFile.path
      } else {
        this.customPath = ''
      }
    },

    async doCommit () {
      this.committing = true
      this.errorMsg   = null
      this.isConflict = false

      let owner, repo
      if (this.changeRepo && this.selectedRepoFull) {
        const [o, ...parts] = this.selectedRepoFull.split('/')
        owner = o
        repo  = parts.join('/')
      } else {
        owner = this.githubFile ? this.githubFile.owner : undefined
        repo  = this.githubFile ? this.githubFile.repo  : undefined
      }

      const isNewBranch = this.changeBranch && this.branchMode === 'new'
      const branch = this.changeBranch
        ? (isNewBranch ? (this.newBranchName.trim() || undefined) : (this.selectedBranch || undefined))
        : (this.githubFile ? this.githubFile.branch : undefined)

      const path = this.changePath && this.customPath.trim()
        ? this.customPath.trim()
        : (this.githubFile ? this.githubFile.path : '')

      try {
        await this.$store.dispatch('commitToGithub', {
          message: this.commitMessage.trim(),
          owner,
          repo,
          path,
          branch,
          ...(isNewBranch ? {
            createNewBranch: true,
            baseBranch: this.githubFile ? this.githubFile.branch : undefined,
          } : {}),
        })
        this.$store.dispatch('notifications/notify', {
          message: 'Changes committed to GitHub successfully.',
          type: 'success',
        })
        this.closeModal()
      } catch (err) {
        if (err.isConflict) {
          this.isConflict = true
        } else {
          this.errorMsg = err.message || 'Failed to commit to GitHub.'
        }
        this.$store.dispatch('notifications/notify', {
          message: this.isConflict
            ? 'Commit failed: the file was modified on GitHub after you loaded it.'
            : (this.errorMsg || 'Failed to commit to GitHub.'),
          type: 'error',
        })
      } finally {
        this.committing = false
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
.commit-target-summary {
  padding: 0.4rem 0.6rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.8rem;
  word-break: break-all;
}
</style>
