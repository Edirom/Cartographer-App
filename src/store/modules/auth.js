import { Octokit } from '@octokit/rest'

const TOKEN_KEY = 'gh_access_token'
const TOKEN_EXPIRY_KEY = 'gh_access_token_expires_at'
const OAUTH_STATE_KEY = 'gh_oauth_state'
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function decodeBase64Utf8 (encoded) {
  const binary = atob(encoded.replace(/[\n\r]/g, ''))
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function encodeBase64Utf8 (text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function getStoredToken () {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  return token
}

function setStoredToken (token) {
  if (token) {
    const expiresAt = Date.now() + TOKEN_TTL_MS
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt))
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  }
}

function setStoredOAuthState (state) {
  if (state) {
    sessionStorage.setItem(OAUTH_STATE_KEY, state)
  } else {
    sessionStorage.removeItem(OAUTH_STATE_KEY)
  }
}

function generateOAuthState () {
  const bytes = new Uint8Array(16)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default {
  namespaced: true,

  state: () => ({
    accessToken: getStoredToken(),
    user: null,               // { login, name, avatar_url }
    repos: [],                // array of { full_name, name, owner, private }
    repoContents: [],         // current directory listing
    selectedRepo: null,       // { full_name, name, owner }
    currentRepoPath: '',      // current browsing path within the selected repo
    selectedFile: null,       // { name, path, sha } of the file to import
    loadingRepos: false,
    loadingContents: false,
    branches: [],             // branches of the selected repository
    selectedBranch: null,     // { name } of the selected branch
    loadingBranches: false,
    devicePrompt: null,       // { userCode, uri } while device-flow login is pending
  }),

  mutations: {
    SET_TOKEN (state, token) {
      state.accessToken = token
      setStoredToken(token)
    },
    SET_USER (state, user) {
      state.user = user
    },
    SET_REPOS (state, repos) {
      state.repos = repos
    },
    SET_REPO_CONTENTS (state, contents) {
      state.repoContents = contents
    },
    SET_SELECTED_REPO (state, repo) {
      state.selectedRepo = repo
      state.currentRepoPath = ''
      state.repoContents = []
      state.selectedFile = null
      state.branches = []
      state.selectedBranch = null
    },
    CLEAR_SELECTED_REPO (state) {
      state.selectedRepo = null
      state.currentRepoPath = ''
      state.repoContents = []
      state.selectedFile = null
      state.branches = []
      state.selectedBranch = null
    },
    SET_CURRENT_REPO_PATH (state, path) {
      state.currentRepoPath = path
    },
    SET_SELECTED_FILE (state, file) {
      state.selectedFile = file
    },
    SET_LOADING_REPOS (state, bool) {
      state.loadingRepos = bool
    },
    SET_LOADING_CONTENTS (state, bool) {
      state.loadingContents = bool
    },
    SET_LOADING_BRANCHES (state, bool) {
      state.loadingBranches = bool
    },
    SET_BRANCHES (state, branches) {
      state.branches = branches
    },
    SET_SELECTED_BRANCH (state, branch) {
      state.selectedBranch = branch
      state.currentRepoPath = ''
      state.repoContents = []
      state.selectedFile = null
    },
    CLEAR_SELECTED_BRANCH (state) {
      state.selectedBranch = null
      state.currentRepoPath = ''
      state.repoContents = []
      state.selectedFile = null
    },
    SET_DEVICE_PROMPT (state, prompt) {
      state.devicePrompt = prompt
    },
  },

  actions: {
    /** Redirect the browser to the GitHub OAuth authorization page. */
    login () {
      const clientId = process.env.GH_APP_CLIENT_ID      // was GH_APP_CLIENT_ID
      const callbackUrl = process.env.GH_APP_CALL_BACK   // was GH_APP_CALL_BACK
      const state = generateOAuthState()
      setStoredOAuthState(state)
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'repo user:email',
        state,
      })
      window.location.href = `https://github.com/login/oauth/authorize?${params}`
    },
    /** GitHub Device Flow login for the native (Tauri) builds. */
    async loginDevice ({ commit, dispatch }) {
      const { invoke } = await import('@tauri-apps/api/core')
      const clientId = process.env.GH_APP_CLIENT_ID
      const dc = await invoke('gh_device_code', { clientId })

      commit('SET_DEVICE_PROMPT', { userCode: dc.user_code, uri: dc.verification_uri })

      let interval = (dc.interval || 5) * 1000
      const deadline = Date.now() + dc.expires_in * 1000
      try {
        while (Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, interval))
          const res = await invoke('gh_poll_token', { clientId, deviceCode: dc.device_code })
          if (res.access_token) {
            commit('SET_TOKEN', res.access_token)
            return dispatch('fetchUser')
          }
          if (res.error === 'authorization_pending') continue
          if (res.error === 'slow_down') { interval += 5000; continue }
          throw new Error(res.error_description || res.error)
        }
        throw new Error('Login timed out — please try again')
      } finally {
        commit('SET_DEVICE_PROMPT', null)
      }
    },
    /** Exchange the OAuth authorization code for an access token. */
    async authenticate ({ commit, dispatch }, { code }) {
      // GitHub requires the client_secret at the token endpoint and that
      // endpoint has no CORS support, so we call a same-origin /auth path that
      // nginx (or the dev proxy) forwards to GitHub with the client_id and
      // client_secret injected server-side — the secret never reaches the browser.
      const res = await fetch(`${process.env.BASE_URL}auth?code=${encodeURIComponent(code)}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error_description || body.error || `Token exchange failed (${res.status})`)
      }
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error_description || data.error)
      }
      commit('SET_TOKEN', data.access_token)
      await dispatch('fetchUser')
    },

    /** Restore the user session from a stored token on app startup. */
    async restoreSession ({ state, commit, dispatch }) {
      if (!state.accessToken) return
      try {
        await dispatch('fetchUser')
      } catch {
        // Token is expired or revoked — clear it silently
        commit('SET_TOKEN', null)
        commit('SET_USER', null)
      }
    },

    /** Fetch the authenticated user's GitHub profile. */
    async fetchUser ({ state, commit }) {
      if (!state.accessToken) return
      const octokit = new Octokit({ auth: state.accessToken })
      const { data } = await octokit.rest.users.getAuthenticated()
      commit('SET_USER', {
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatar_url,
      })
    },

    /** Fetch repositories accessible by the authenticated user. */
    async fetchRepos ({ state, commit }) {
      if (!state.accessToken) return
      commit('SET_LOADING_REPOS', true)
      try {
        const octokit = new Octokit({ auth: state.accessToken })
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 100,
          affiliation: 'owner,collaborator,organization_member',
        })
        commit('SET_REPOS', data.map(r => ({
          full_name: r.full_name,
          name: r.name,
          owner: r.owner.login,
          private: r.private,
        })))
      } finally {
        commit('SET_LOADING_REPOS', false)
      }
    },

    /** Select a repository and load its branches. */
    async selectRepo ({ commit, dispatch }, repo) {
      commit('SET_SELECTED_REPO', repo)
      await dispatch('fetchBranches', repo)
    },

    /** Deselect the current repository and return to the repo list. */
    clearSelectedRepo ({ commit }) {
      commit('CLEAR_SELECTED_REPO')
    },

    /** Fetch branches for the given repository. */
    async fetchBranches ({ state, commit }, repo) {
      if (!state.accessToken) return
      commit('SET_LOADING_BRANCHES', true)
      try {
        const octokit = new Octokit({ auth: state.accessToken })
        const { data } = await octokit.rest.repos.listBranches({
          owner: repo.owner,
          repo: repo.name,
          per_page: 100,
        })
        commit('SET_BRANCHES', data.map(b => ({ name: b.name })))
      } finally {
        commit('SET_LOADING_BRANCHES', false)
      }
    },

    /** Select a branch and load the repository root contents for that branch. */
    async selectBranch ({ commit, dispatch, state }, branch) {
      commit('SET_SELECTED_BRANCH', branch)
      await dispatch('fetchRepoContents', { repo: state.selectedRepo, path: '' })
    },

    /** Deselect the current branch and return to the branch list. */
    clearSelectedBranch ({ commit }) {
      commit('CLEAR_SELECTED_BRANCH')
    },

    /** Fetch the contents of a directory within the selected repository. */
    async fetchRepoContents ({ state, commit }, { repo, path }) {
      if (!state.accessToken) return
      commit('SET_LOADING_CONTENTS', true)
      try {
        const octokit = new Octokit({ auth: state.accessToken })
        const params = {
          owner: repo.owner,
          repo: repo.name,
          path: path || '',
        }
        if (state.selectedBranch) params.ref = state.selectedBranch.name
        const { data } = await octokit.rest.repos.getContent(params)
        const items = Array.isArray(data) ? data : [data]
        commit('SET_REPO_CONTENTS',
          items
            .map(i => ({ name: i.name, path: i.path, type: i.type, sha: i.sha }))
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
        )
        commit('SET_CURRENT_REPO_PATH', path || '')
        commit('SET_SELECTED_FILE', null)
      } finally {
        commit('SET_LOADING_CONTENTS', false)
      }
    },

    /** Mark a file item as selected for import. */
    selectFile ({ commit }, file) {
      commit('SET_SELECTED_FILE', file)
    },

    /** Fetch and decode the content of a file from GitHub. Returns { xml, sha, path }. */
    async getFileContent ({ state }, { repo, path, ref }) {
      if (!state.accessToken) throw new Error('Not authenticated')
      const octokit = new Octokit({ auth: state.accessToken })
      const params = {
        owner: repo.owner,
        repo: repo.name,
        path,
      }
      // explicit ref takes priority, then the currently selected branch
      if (ref) params.ref = ref
      else if (state.selectedBranch) params.ref = state.selectedBranch.name
      const { data } = await octokit.rest.repos.getContent(params)
      if (Array.isArray(data)) throw new Error(`${path} is a directory, not a file`)
      let base64
      if (data.content && data.encoding === 'base64') {
        base64 = data.content
      } else {
        const { data: blob } = await octokit.rest.git.getBlob({
          owner: repo.owner,
          repo: repo.name,
          file_sha: data.sha,
        })
        base64 = blob.content
      }
      const xml = decodeBase64Utf8(base64)
      return { xml, sha: data.sha, path: data.path }
    },

    /** Fetch raw binary content of a file from GitHub. Returns { bytes, name, path }. */
    async getImageContent ({ state }, { repo, path }) {
      const octokit = new Octokit({ auth: state.accessToken })
      const params = {
        owner: repo.owner,
        repo: repo.name,
        path,
      }
      if (state.selectedBranch) params.ref = state.selectedBranch.name
      const { data } = await octokit.rest.repos.getContent(params)
      if (Array.isArray(data)) throw new Error(`${path} is a directory`)
      let base64
      if (data.content && data.encoding === 'base64') {
        // File under ~1MB — content is inline in the API response
        base64 = data.content
      } else {
        // File over 1MB — fetch via Git Blobs API (stays on api.github.com, no CORS issue)
        const { data: blob } = await octokit.rest.git.getBlob({
          owner: repo.owner,
          repo: repo.name,
          file_sha: data.sha,
        })
        base64 = blob.content
      }
      const binary = atob(base64.replace(/[\n\r]/g, ''))
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return { bytes, name: data.name, path: data.path }
    },

    /** Commit updated file content back to GitHub. Returns the new blob SHA. */
    async commitFile ({ state }, { repo, path, sha, content, message, branch }) {
      const octokit = new Octokit({ auth: state.accessToken })
      const encoded = encodeBase64Utf8(content)
      const payload = {
        owner: repo.owner,
        repo: repo.name,
        path,
        message: message || 'Update MEI file via Cartographer',
        content: encoded,
      }
      if (sha) payload.sha = sha   // omit sha for new-file creation
      if (branch) payload.branch = branch
      const { data } = await octokit.rest.repos.createOrUpdateFileContents(payload)
      return data.content ? data.content.sha : null
    },

    /** Create a new branch in the target repo.
     *  - Same repo: pass baseBranch to fork from a specific branch.
     *  - Different repo: omit baseBranch; the target repo's default branch is
     *    always used as the base — never try to match a source branch by name. */
    async createBranch ({ state }, { repo, newBranch, baseBranch }) {
      if (!state.accessToken) throw new Error('Not authenticated')
      const octokit = new Octokit({ auth: state.accessToken })

      let baseSha
      if (baseBranch) {
        // Same-repo path: use the exact branch the user was working on
        const { data: ref } = await octokit.rest.git.getRef({
          owner: repo.owner,
          repo: repo.name,
          ref: `heads/${baseBranch}`,
        })
        baseSha = ref.object.sha
      } else {
        // Different-repo path: always resolve the target repo's own default branch
        const { data: repoData } = await octokit.rest.repos.get({
          owner: repo.owner,
          repo: repo.name,
        })
        const { data: defaultRef } = await octokit.rest.git.getRef({
          owner: repo.owner,
          repo: repo.name,
          ref: `heads/${repoData.default_branch}`,
        })
        baseSha = defaultRef.object.sha
      }

      await octokit.rest.git.createRef({
        owner: repo.owner,
        repo: repo.name,
        ref: `refs/heads/${newBranch}`,
        sha: baseSha,
      })
    },

    /** Clear all auth state and remove the stored token. */
    async logout ({ commit, dispatch }) {
      await dispatch('revokeGithubBlobUrls', null, { root: true })
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
      commit('SET_REPOS', [])
      commit('SET_REPO_CONTENTS', [])
      commit('CLEAR_SELECTED_REPO')
    },
  },

  getters: {
    isAuthenticated: state => state.accessToken !== null,
    user:            state => state.user,
    accessToken:     state => state.accessToken,
    repos:           state => state.repos,
    repoContents:    state => state.repoContents,
    selectedRepo:    state => state.selectedRepo,
    currentRepoPath: state => state.currentRepoPath,
    selectedFile:    state => state.selectedFile,
    loadingRepos:    state => state.loadingRepos,
    loadingContents: state => state.loadingContents,
    branches:        state => state.branches,
    selectedBranch:  state => state.selectedBranch,
    loadingBranches: state => state.loadingBranches,
  },
}
