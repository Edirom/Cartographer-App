
<template>
  <tr>
    <td class="pn">{{ page.n }}</td>
    <td class="pl">
      <input type="text" v-model="pageLabelValue">
    </td>
    <td class="img"><img @click="showPage" :src="thumbnailSrc"/></td>
    <td class="uri">{{ pageUri }}</td>
    <td class="dim">{{ page.dim }}</td>
  </tr>
</template>

<script>

export default {
  name: 'PagesListEntry',
  props: {
    page: Object,
    index: Number
  },
  computed: {
    thumbnailSrc () {
      const ts = this.page.tileSource
      if (typeof ts === 'object' && ts !== null) {
        return ts.url
      }
      return ts + '/full/,45/0/default.jpg'
    },
    pageUri () {
      const ts = this.page.tileSource
      return (typeof ts === 'object' && ts !== null) ? ts.url : ts
    },
    pageLabelValue: {
      get () {
        return this.page.label
      },
      set (val) {
        const index = this.index
        this.$store.dispatch('setPageLabel', { index, val })
      }
    }
  },
  methods: {
    showPage: function () {
      this.$store.dispatch('togglePagesModal')
      this.$store.dispatch('setCurrentPage', this.index)
    }
  }
}
</script>

<style lang="scss" scoped>
  .pl {

    input {
      width: 3rem;
      border: none;
      background-color: unset;
      font-weight: 700;
      padding: 0 .2rem;
    }
  }

  .uri, .dim {
    font-weight: 100;
  }
</style>
