<template>
  <div>
    <LoadXMLModal v-if="showLoadXMLModal"/>
    <LoadIIIFModal v-if="showLoadIIIFModal"/>
    <LoadGitModal v-if="showLoadGitModal"/>
    <CommitModal v-if="showCommitModal"/>
    <LoadLocalImage v-if="showLoadLocalImage"/>
    <ImageMismatchModal v-if="showImageMismatchModal"/>
    <div v-if="loading" class="loading-overlay">
      <div class="loading loading-lg"></div>
    </div>
    <!--<ImageSelectionModal/>-->
    <MeasureModal v-if="showMeasureModal"/>
    <MdivModal v-if="showMdivModal"/>
    <PagesModal v-if="showPagesModal"/>
    <PageImportModal v-if="showPageImportModal"/>
    <AboutModal v-if="showAboutModal"/>
    <AppHeader/>
    <OsdComponent/>
    <ContentPreviewPane/>
    <AppSidebar/>
    <AppFooter/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { mode as allowedModes } from '@/store/constants.js'
import AppHeader from '@/components/AppHeader.vue'
import ContentPreviewPane from '@/components/ContentPreviewPane.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppFooter from '@/components/AppFooter.vue'
import OsdComponent from '@/components/OsdComponent.vue'
// import ImageSelectionModal from '@/components/ImageSelectionModal.vue'
import MeasureModal from '@/components/MeasureModal.vue'
import PagesModal from '@/components/PagesModal.vue'
import PageImportModal from '@/components/PageImportModal.vue'
import MdivModal from '@/components/MdivModal.vue'
import LoadXMLModal from '@/components/LoadXMLModal.vue'
import LoadIIIFModal from '@/components/LoadIIIFModal.vue'
import LoadGitModal from '@/components/LoadGitModal.vue'
import CommitModal from '@/components/CommitModal.vue'
import LoadLocalImage from '@/components/LoadLocalImage.vue'
import ImageMismatchModal from '@/components/ImageMismatchModal.vue'
import AboutModal from '@/components/AboutModal.vue'


export default {
  name: 'App',
  components: {
    AppHeader,
    ContentPreviewPane,
    AppSidebar,
    AppFooter,
    OsdComponent,
    // ImageSelectionModal,
    MeasureModal,
    PagesModal,
    PageImportModal,
    MdivModal,
    LoadXMLModal,
    LoadIIIFModal,
    LoadGitModal,
    CommitModal,
    LoadLocalImage,
    ImageMismatchModal,
    AboutModal
  },
  computed: {
    ...mapGetters([
      'showLoadXMLModal',
      'showLoadIIIFModal',
      'showLoadGitModal',
      'showCommitModal',
      'showLoadLocalImage',
      'showMeasureModal',
      'showMdivModal',
      'showPagesModal',
      'showPageImportModal',
      'showImageMismatchModal',
      'showAboutModal',
      'loading',
    ])
  },
  mounted () {
    window.addEventListener('keyup', e => {
      // console.log('keyupped ' + e.key)
      const target = e.target
      const isTypingTarget = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )

      if (isTypingTarget) return

      if (e.key === 'm') {
        this.$store.dispatch('toggleMeasureList')
      } else if (e.key === 'p') {
        this.$store.dispatch('togglePagesModal')
      } else if (e.key === 'd') {
        this.$store.dispatch('setMode', allowedModes.manualRect)
      } else if (e.key === 'a') {
        this.$store.dispatch('setMode', allowedModes.additionalZone)
      } else if (e.key === 'x') {
        this.$store.dispatch('setMode', allowedModes.deletion)
      } else if (e.key === 's') {
        this.$store.dispatch('setMode', allowedModes.selection)
      }
    })
  }
}
</script>

<style lang="scss">
@import '@/css/_variables.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $fontColorDark;
  height: 100vh;
  height: 100dvh; // track the actual visible height on mobile (collapsing toolbars)
  width: 100%;
  position: relative;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}
</style>