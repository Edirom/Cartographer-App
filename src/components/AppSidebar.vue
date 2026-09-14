<template>
  <div class="appSidebar">
    <div class="toolButtons">
    <!-- SELECT -->
    <button class="btn btn-action" :class="{'activeMode': mode === 'selection'}"
      title="select measure (s)" :disabled="!isReady"
      @click="activateMode('selection')">
      <font-awesome-icon icon="fa-solid fa-arrow-pointer"/>
    </button>

    <!-- DRAW -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'manualRect'}"
      title="draw measures (d)" :disabled="!isReady"
      @click="activateMode('manualRect')">
      <font-awesome-icon icon="fa-solid fa-pen"/>
    </button>

    <!-- UNDO -->
    <button class="btn btn-action" title="undo changes" :disabled="!canUndo"
      @click="undoChanges">
      <font-awesome-icon icon="fa-solid fa-rotate-left"/>
    </button>

    <!-- REDO -->
    <button class="btn btn-action" title="redo changes" :disabled="!canRedo"
      @click="redoChanges">
      <font-awesome-icon icon="fa-solid fa-rotate-right"/>
    </button>

    <!-- RECTANGLE -->
    <!-- <button class="btn btn-action" title="draw rectangle" :disabled="!isReady">
      <font-awesome-icon icon="fa-solid fa-crop-simple"/>
    </button> -->

    <!-- SPLIT HORIZONTALLY -->
    <!-- button class="btn btn-action"  :class="{'activeMode': mode === 'splitHorizontal'}"
      title="split measure horizontally" :disabled="!isReady"
      @click="activateMode('splitHorizontal')">
      <font-awesome-icon icon="fa-solid fa-scissors"/>
    </button> -->

    <!-- SPLIT VERTICALLY -->
    <!-- <button class="btn btn-action"  :class="{'activeMode': mode === 'splitVertical'}"
      title="split measure vertically" :disabled="!isReady"
      @click="activateMode('splitVertical')">
      <font-awesome-icon icon="fa-solid fa-scissors" rotation="270"/>
    </button> -->

    <!-- ADDITIONAL ZONE PER MEASURE -->
      <!-- @click="activateMode('additionalZone')"> -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'additionalZone'}"
      title="add zone to last measure (a)"
      :disabled="!isReady || measures.length === 0"
      @click="activateMode('additionalZone')">
      <template v-if="mode === 'additionalZone'">
        <font-awesome-icon icon="fa-solid fa-square-plus"/>
      </template>
      <template v-else>
        <font-awesome-icon icon="fa-regular fa-square-plus"/>
      </template>
    </button>

    <!-- DELETE MEASURE -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'deletion'}"
      title="delete measure (x)" :disabled="!isReady"
      @click="activateMode('deletion')">
      <font-awesome-icon icon="fa-solid fa-eraser"/>
    </button>
    <!-- MDIV -->
    <!-- <button class="btn btn-action"  :class="{'activeMode': mode === 'mdiv'}"
      title="select movement" :disabled="!isReady"
      @click="activateMode('mdiv')">
      <font-awesome-icon icon="fa-solid fa-sitemap"/>
    </button> -->

    <div class="automaticTools">
      <!-- AUTODETECT ON CURRENT PAGE -->
      <button class="btn btn-action" title="Autodetect measures on current page"
        :disabled="!isReady"
        @click="autoDetect">
        <font-awesome-layers>
          <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
          <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
        </font-awesome-layers>
      </button>
        <!-- AUTODETECT ON ALL PAGE
        <button class="btn btn-action" title="Autodetect measures on current page"
          :disabled="!isReady"
          @click="autoDetectAll">
          <font-awesome-layers>
            <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
            <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
            <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
          </font-awesome-layers>
      </button> -->

      <!-- AUTODETECT ALL PAGES -->
      <!-- <button class="btn btn-action" title="Autodetect measures throughout document"
      :disabled="!isReady"
      @click="autoDetectAll">
        <font-awesome-layers>
          <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
          <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
          <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
        </font-awesome-layers>
      </button> -->

    </div>

    </div>

    <div class="pageNav">
      <label>Page</label>
      <input type="text" class="currentPageInput" v-model="inputPage"
        :placeholder="String(currentPage)"
        v-on:keyup.enter="jumpToPage()"
        title="Enter a page number and press Enter to jump"/>
      <span class="maxPage">of {{ maxPage }}</span>
      <span class="pageBtn" :class="{ disabled: !prevAvailable }" @click="showPrevPage">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="pageBtn" :class="{ disabled: !nextAvailable }" @click="showNextPage">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </span>
    </div>
    <!-- this could be used for score setup
    <button class="btn btn-action">
      <font-awesome-layers>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="up-8 shrink-5"/>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="shrink-5"/>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="down-8 shrink-5"/>
      </font-awesome-layers>
    </button>-->
    <!-- these could be used for score vs. parts
    <button class="btn btn-action">
      <font-awesome-icon icon="fa-solid fa-stop"/>
    </button>
    <button class="btn btn-action">
      <font-awesome-icon icon="fa-solid fa-layer-group"/>
    </button>-->

    <!--<button class="btn btn-action">
      <font-awesome-layers>
        <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
        <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
        <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
      </font-awesome-layers>
    </button>-->
  </div>
</template>

<script>
import { mode as allowedModes } from '@/store/constants.js'

export default {
  name: 'AppSidebar',
  components: {

  },
  data: function () {
    return {
      inputPage: ''
    }
  },
  computed: {
    isReady: function () {
      return this.$store.getters.isReady
    },
    multiZone: function () {
      return this.$store.getters.multiZoneActive
    },
    currentPage: function () {
      return this.$store.getters.currentPageIndexOneBased
    },
    maxPage: function () {
      return this.$store.getters.maxPageNumber
    },
    prevAvailable: function () {
      return this.$store.getters.currentPageIndexZeroBased > 0
    },
    nextAvailable: function () {
      return this.$store.getters.currentPageIndexOneBased < this.$store.getters.maxPageNumber
    },
    mode: function () {
      return this.$store.getters.mode
    },
    measures: function () {
      return this.$store.getters.measures
    },
    canUndo: function () {
      return this.$store.getters.canUndo
    },
    canRedo: function () {
      return this.$store.getters.canRedo
    }
    /* visible: function() {
      return this.$store.getters.imageSelectionModalVisible
    } */
  },
  watch: {
    currentPage: function (newPage) {
      this.inputPage = newPage
    }
  },
  mounted: function () {
    this.inputPage = this.currentPage
  },
  methods: {
    jumpToPage: function () {
      const raw = String(this.inputPage).trim()
      const maxPage = this.$store.getters.maxPageNumber
      let message = null
      if (raw === '') {
        message = 'Please enter a page number.'
      } else if (!/^-?\d+$/.test(raw)) {
        message = 'Page must be a whole number.'
      } else {
        const page = parseInt(raw, 10)
        if (page <= 0) {
          message = 'Page number must be 1 or greater.'
        } else if (page > maxPage) {
          message = `Page number is out of range. Enter a value between 1 and ${maxPage}.`
        } else {
          this.$store.dispatch('setCurrentPage', page - 1)
          return
        }
      }
      this.$store.dispatch('notifications/notify', { message, type: 'warning' })
      this.inputPage = this.currentPage
    },
    showPrevPage: function () {
      if (!this.prevAvailable) {
        return
      }
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased - 1)
    },
    showNextPage: function () {
      if (!this.nextAvailable) {
        return
      }
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased + 1)
    },
    autoDetect: function () {
      this.$store.dispatch('autoDetectZonesOnCurrentPage')
    },
    autoDetectAll: function () {
      this.$store.dispatch('autoDetectZonesOnAllPage')
    },
    activateMode: function (mode) {
      if (mode in allowedModes) {
        this.$store.dispatch('setMode', mode)
        // if (mode === allowedModes.additionalZone && mode === this.mode) {
        //   // console.log("Additional zone")
        //   // this.$store.dispatch('setMode', allowedModes.manualRect)
        // } else {
        //   this.$store.dispatch('setMode', mode)
        // }
        // if (mode === allowedModes.deletion) {
        //   this.$store.dispatch('setMode', mode)
        // }
        // if (mode === allowedModes.login) {
        //   this.$store.dispatch('setMode', mode)
        // }
      } else {
        console.error('mode ' + mode + ' is not known. Please check AppSidebar.vue and @/store/index.js.')
      }
    },
    undoChanges: function () {
      this.$store.dispatch('undo')
    },
    redoChanges: function () {
      this.$store.dispatch('redo')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.appSidebar {
  height: calc(100vh - $appHeaderHeight - $appFooterHeight);
  height: calc(100dvh - #{$appHeaderHeight} - #{$appFooterHeight} - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  width: $appSidebarWidth;
  background-color: $appColor;
  float: right;
  padding-top: .4rem;
  box-sizing: border-box;
  // Lay the sidebar out as a column so the page navigation can be pinned to
  // the bottom and stay clickable, while the tool buttons take the remaining
  // space and scroll on short viewports (instead of overflowing behind the
  // footer, which would swallow the prev/next clicks).
  display: flex;
  flex-direction: column;

  .toolButtons {
    flex: 0 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  button {
    color: $fontColorDark;
    border-color: $fontColorDark;
  }

  .btn-action {
    margin: 0 0 .2rem 0;

    &.activeMode {
      background-color: #a6e9fd;
      box-shadow: 0 0.01rem 0.2rem rgba(0, 0, 0, 0.3) inset;
    }
  }

  .automaticTools {
    margin: .5rem 0;
  }

  .pageNav {
    flex: 0 0 auto;
    background-color: #ffffff;
    border: 0.05rem solid #000000;
    border-radius: 2px;
    margin: 0 .35rem .2rem .35rem;
    // display: none;
    label {
      display: block;
      font-weight: 100;
      font-size: .5rem;
    }
    .currentPageInput {
      display: block;
      width: 80%;
      margin: 0 auto;
      font-weight: 300;
      text-align: center;
      border: $thinBorder;
      border-radius: 2px;
      padding: 0;
      font-size: .7rem;
      line-height: 1rem;
      box-sizing: border-box;
    }

    .maxPage {
      display: block;
      font-weight: 100;
      font-size: .5rem;
      line-height: .6rem;
    }

    .pageBtn {
      padding: 0 .1rem;
      cursor: pointer;

      &.disabled {
        opacity: .35;
        cursor: default;
        pointer-events: none;
      }
    }
  }
}
</style>
