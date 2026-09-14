<template>
  <div class="contentPreviewPane" v-if="visible">
    <ContentPreviewMdiv v-for="(mdiv, i) in mdivs" :key="i + 'mdiv'" :mdiv="mdiv"/>
  </div>
</template>

<script>
import ContentPreviewMdiv from '@/components/ContentPreviewMdiv.vue'

export default {
  name: 'ContentPreviewPane',
  components: {
    ContentPreviewMdiv
  },
  computed: {
    mdivs: function () {
      return this.$store.getters.mdivs
    },
    visible: function () {
      return this.$store.getters.showMeasureList
    }
    /* visible: function() {
      return this.$store.getters.imageSelectionModalVisible
    } */
  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.contentPreviewPane {
  height: calc(100vh - $appHeaderHeight - $appFooterHeight);
  height: calc(100dvh - #{$appHeaderHeight} - #{$appFooterHeight} - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  width: $contentPreviewPaneWidth;
  background-color: #ffffff;
  padding: .2rem;
  float: right;
  text-align: left;
  overflow-y: scroll;
}
</style>
