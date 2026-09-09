<template>
  <div
    :class="['contentPreviewMdiv', { active: isActive}]"
    @click="selectAndJumpToMdiv"
  >
    <h1>{{ mdiv.label }}</h1>
    <ContentPreviewMeasure
      v-for="(measure, i) in measures"
      :key="i"
      :measure="measure"
      :mdiv="mdiv.id"
    />
  </div>
</template>

<script>
import ContentPreviewMeasure from "@/components/ContentPreviewMeasure.vue";

export default {
  name: "ContentPreviewMdiv",
  components: {
    ContentPreviewMeasure,
  },
  props: {
    mdiv: Object,
  },
  computed: {
    measures: function () {
      return this.$store.getters.measuresByMdivId(this.mdiv.id);
    },
    isActive: function () {
      return this.$store.state.currentMdivId === this.mdiv.id;
    },
    /* visible: function() {
      return this.$store.getters.imageSelectionModalVisible
    } */
  },
  methods: {
    selectAndJumpToMdiv: function () {
      this.$store.dispatch("setCurrentMdiv", this.mdiv.id);
      const measures = this.$store.getters.measuresByMdivId(this.mdiv.id);

      if (measures.length > 0 && measures[0].zones.length > 0) {
        const firstZoneId = measures[0].zones[0].replace(/^#/, "");
        const pageIndex = this.findPageIndexByZoneId(firstZoneId);

        if (pageIndex !== -1) {
          this.$store.dispatch("setCurrentPage", pageIndex);
        }
      }
    },
    findPageIndexByZoneId: function (zoneId) {
      if (!this.$store.getters.isReady) return -1;

      const xmlDoc = this.$store.state.xmlDoc;
      const zones = xmlDoc.querySelectorAll("zone");

      for (const zone of zones) {
        // of-Loop ist modern und effizient
        if (zone.getAttribute("xml:id") === zoneId) {
          const surface = zone.closest("surface");
          const surfaces = xmlDoc.querySelectorAll("surface");
          return Array.from(surfaces).indexOf(surface);
        }
      }
      return -1;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/css/_variables.scss";

.contentPreviewMdiv + .contentPreviewMdiv {
  margin-top: 0.5rem;
  &.active {
    background-color: lighten($appColor, 30%);

    h1 {
      background-color: darken($appColor, 5%);
    }
  }
}

.contentPreviewMdiv {
  h1 {
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0.1rem 0.3rem;
    background-color: lighten($appColor, 25%);
    border-radius: 3px;
    margin: 0;
    cursor: pointer;
  }
}
</style>
