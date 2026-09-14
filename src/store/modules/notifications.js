let nextId = 1

export default {
  namespaced: true,

  state: () => ({
    items: [], // { id, message, type }
  }),

  mutations: {
    ADD (state, notification) {
      state.items.push(notification)
    },
    REMOVE (state, id) {
      state.items = state.items.filter(n => n.id !== id)
    },
  },

  actions: {
    /**
     * Show a transient toast notification.
     * @param {string} message - Text to display.
     * @param {string} [type=primary] - primary | success | error | warning.
     * @param {number} [timeout=5000] - Auto-dismiss delay in ms; 0 keeps it until dismissed.
     */
    notify ({ commit }, { message, type = 'primary', timeout = 5000 }) {
      const id = nextId++
      commit('ADD', { id, message, type })
      if (timeout > 0) {
        setTimeout(() => commit('REMOVE', id), timeout)
      }
      return id
    },
    dismiss ({ commit }, id) {
      commit('REMOVE', id)
    },
  },

  getters: {
    notifications: state => state.items,
  },
}
