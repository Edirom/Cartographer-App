<template>
  <div id="osdContainer" :class="{'fullWidth': !measureListVisible}"></div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import * as Annotorious from '@recogito/annotorious-openseadragon'
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css'
import { uuid } from '@/tools/uuid.js'

import { mode as allowedModes } from '@/store/constants.js'

export default {
  name: 'OsdComponent',
  components: {

  },
  data() {
    return {
      colors: [
        'rgba(255, 87, 51, 0.2)', 'rgba(51, 255, 87, 0.2)', 'rgba(51, 87, 255, 0.2)', 'rgba(255, 51, 161, 0.2)', 'rgba(161, 51, 255, 0.2)',
        'rgba(51, 255, 245, 0.2)', 'rgba(255, 140, 51, 0.2)', 'rgba(140, 255, 51, 0.2)', 'rgba(51, 140, 255, 0.2)', 'rgba(255, 51, 140, 0.2)'
      ],
      colorIndex: 0,
      mdivColors: {}
    }
  },
  computed: {
    imageArray: function () {
      return this.$store.getters.imageArray
    },
    mode: function () {
      return this.$store.getters.mode
    },
    measureListVisible: function () {
      return this.$store.getters.showMeasureList
    }
  },
  methods: {
    getNextColor() {
      const color = this.colors[this.colorIndex];
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
      return color;
    },
    renderZones: function () {
      this.viewer.clearOverlays()
      const annots = this.$store.getters.zonesOnCurrentPage
      annots.forEach(annot => {
        // console.log('trying to render zone based on: ')
        // console.log(annot)
        const rawDimensions = annot.target.selector.value.substr(11).split(',')
        console.log("raw dimention is ", rawDimensions)
        const xywh = {
          x: Math.round(rawDimensions[0]),
          y: Math.round(rawDimensions[1]),
          w: Math.round(rawDimensions[2]),
          h: Math.round(rawDimensions[3])
        }
        const zoneId = annot.id.replace(/#/, '')
        const measureCssLink = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('measure'))?.selector.value
        const mdivCssLink = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('mdiv'))?.selector.value
        const mdivIndizes = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('mov_'))?.selector.value

        console.log('mdivIndizes', mdivIndizes)

        // Get or assign color for mdiv
        if (!this.mdivColors[mdivIndizes]) {
          this.mdivColors[mdivIndizes] = this.getNextColor()
        }
        const color = this.mdivColors[mdivIndizes]
        const borderColor = color.replace(/[\d\.]+\)$/g, '0.5)')
        
        console.log("this is xywh " , "", xywh.x,"", xywh.y, "", xywh.w, "", xywh.h)


        const overlay = document.createElement('div')
        overlay.id = zoneId
        overlay.classList.add('zone')
        try { mdivIndizes.split(' ').forEach(mov => { overlay.classList.add(mov) }) } catch (err) {}
        overlay.setAttribute('data-measure', measureCssLink)
        overlay.setAttribute('data-mdiv', mdivCssLink)

        const labelContent = annot.body.find(body => body.type === 'TextualBody')?.value

        const label = document.createElement('div')
        label.classList.add('zoneLabel')
        label.textContent = labelContent

        label.addEventListener('dblclick', (e) => {
          this.$store.dispatch('clickMeasureLabel', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })

        overlay.appendChild(label)
        overlay.addEventListener('mouseout', (e) => {
         console.log('mouseout')
         
          this.$store.dispatch('unhoverZone', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })
        overlay.addEventListener('mouseenter', (e) => {
          console.log("this is e " , "", e.x,"", e.y, "", xywh.w, "", xywh.h, "scree x", e.x)

          console.log('mousenter')
          
          this.$store.dispatch('hoverZone', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })
        overlay.addEventListener('pointerdown', (e) => {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            return;
          } else {
            e.preventDefault();
            overlay.click();
          }

        })
        overlay.addEventListener('click', (e) => {
          console.log('clicked')
          this.$store.dispatch('clickZone', zoneId)
          
          if (e.ctrlKey || e.metaKey) {
            this.$store.dispatch('selectZone', zoneId)
          }
          
          e.preventDefault()
          e.stopPropagation()
        })
        
        // Set colors
        overlay.style.backgroundColor = color
        overlay.style.outline = `1px solid ${borderColor}`

        // Set colors for :hover
        overlay.onmouseenter = () => {
          overlay.style.backgroundColor = color.replace(/[\d\.]+\)$/g, '0.1)');
          overlay.style.outline = borderColor.replace(/[\d\.]+\)$/g, '0.4)');
        }
        // Reset colors after :hover
        overlay.onmouseleave = () => {
          overlay.style.backgroundColor = color;
          overlay.style.outline = borderColor;
        }

        this.viewer.addOverlay({
          element: overlay,
          location: new OpenSeadragon.Rect(xywh.x, xywh.y, xywh.w, xywh.h)
        })
      })
      // this.anno.setAnnotations(annots)
    },
    isDrawingMode: function (mode) {
      const activeModes = [allowedModes.manualRect, allowedModes.additionalZone]
      const currentMode = mode !== undefined ? mode : this.mode
      return activeModes.indexOf(currentMode) !== -1
    },
    toggleSelection: function (mode) {
      const drawing = this.isDrawingMode(mode)
      this.anno.readOnly = !drawing

      // On touch / small-screen devices there is no Shift key to raise the
      // drawing layer, so enable it automatically whenever a drawing mode
      // (manualRect / additionalZone) is active.
      const annoLayer = document.querySelector('.a9s-annotationlayer.a9s-osd-annotationlayer')
      if (annoLayer) {
        annoLayer.classList.toggle('activeSelection', drawing)
      }

      // Disable OpenSeadragon's own gesture navigation while drawing so that
      // touch drags reach the annotation layer instead of panning/zooming the
      // image. Re-enabled for non-drawing tools (e.g. selection) to allow
      // pan/pinch-zoom on touch devices.
      if (this.viewer) {
        this.viewer.setMouseNavEnabled(!drawing)
      }

      // Annotorious only enables its drawing MouseTracker while the Shift
      // hotkey is held. Touch devices have no Shift key, so enable/disable the
      // tracker explicitly based on the active tool instead.
      if (this.anno) {
        this.anno.setDrawingEnabled(drawing)
      }
    }
  },
  mounted: function () {
    this.viewer = OpenSeadragon({
      id: 'osdContainer',
      preserveViewport: false,
      visibilityRatio: 0.8,
      sequenceMode: true,
      showNavigator: false,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showSequenceControl: false,
      gestureSettingsMouse: {
        clickToZoom: false,
      },
      silenceMultiImageWarnings: true
      // navigatorId: 'someId',
      //
      /* homeButton: 'zoomHome',
      zoomInButton: 'zoomIn',
      zoomOutButton: 'zoomOut',
      previousButton: 'pageLeft',
      nextButton: 'pageRight' */
    })

    const annotoriousConfig = {
      disableEditor: true,
    }

    // Initialize the Annotorious plugin
    this.anno = Annotorious(this.viewer, annotoriousConfig)
    // Set the initial drawing state to match the current tool/mode.
    this.toggleSelection(this.mode)


    // Load annotations in W3C WebAnnotation format
    // anno.loadAnnotations('annotations.w3c.json');

    const annoLayer = document.querySelector('.a9s-annotationlayer.a9s-osd-annotationlayer')
    const shiftKeyDown = (e) => {
      if (e.keyCode === 16) {
        annoLayer.classList.add('activeSelection')
        console.log("anno layer " + annoLayer)

      }
    } 
    const shiftKeyUp = (e) => {
      // Keep the drawing layer active when a drawing mode is selected, so
      // releasing Shift on desktop does not disable an active draw tool.
      if (e.keyCode === 16 && !this.isDrawingMode()) {
        annoLayer.classList.remove('activeSelection')
      }
    }
    document.addEventListener('keydown', shiftKeyDown)
    document.addEventListener('keyup', shiftKeyUp)

    this.anno.on('createSelection', async (selection) => {
      // The user has created a new shape...

      // it is necessary to have some type of body, or it will not save
      selection.body = [{
        type: 'TextualBody',
        purpose: 'tagging',
        value: 'measure'
      }]

      await this.anno.updateSelected(selection)
      this.anno.saveSelected()
    })

    this.anno.on('selectAnnotation', async (annotation) => {
      // console.log(annotation)
    })

    this.anno.on('createAnnotation', (annotation) => {
     // const { x, y, width, height } = annotation.shapes[0].geometry;

      // Update the x and y coordinates of the rectangle
      // const newX = x + width; // Example: Move the rectangle to the right of the selected area
      // const newY = y + height; // Example: Move the rectangle below the selected area
      console.log("this is x ",  annotation)
      // console.log("this is y " + newX)
      // The users has created a new annotation
      const newId = 'z' + uuid()
      annotation.id = newId
      this.$store.dispatch('createZone', annotation)
      this.$store.dispatch('selectZone', null)
      this.anno.clearAnnotations()
      this.renderZones()
      // Annotorious disables its drawing tracker after each completed shape
      // (it normally waits for the Shift hotkey again). Re-enable it so the
      // user can keep drawing on touch devices without a keyboard.
      if (this.isDrawingMode()) {
        this.anno.setDrawingEnabled(true)
      }
      console.log("anno is clicked ", annotation.target.selector)
    })

    this.anno.on('updateAnnotation', (annotation) => {
      // The users has selected an existing annotation
      this.$store.dispatch('updateZone', annotation)
      this.$store.dispatch('selectZone', null)
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.viewer.addHandler('open', (data) => {
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.viewer.addHandler('page', (data) => {
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.unwatchPages = this.$store.watch((state, getters) => getters.pages,
      (newArr, oldArr) => {
        console.log('Pages changed in OsdComponent, count:', newArr.length)
        if (!newArr || newArr.length === 0) {
          // Reset / no pages loaded: tear down the currently displayed image.
          // viewer.open([]) does NOT clear an already-open image, so close it
          // explicitly and remove any zone overlays / annotations.
          this.viewer.clearOverlays()
          if (this.anno) {
            this.anno.clearAnnotations()
          }
          this.viewer.close()
          return
        }
        // A string tile source is a IIIF Image API service base. OpenSeadragon
        // does not append /info.json itself, so add it here (some servers, e.g.
        // Gallica, return 404 for the bare service base). Object tile sources
        // (plain/local images) are passed through unchanged.
        const normalized = newArr.map(page => {
          const ts = page.tileSource
          if (typeof ts === 'string') {
            const base = ts.replace(/\/$/, '')
            const src = /\/info\.json$/i.test(base) ? base : base + '/info.json'
            return { ...page, tileSource: src }
          }
          return page
        })
        this.viewer.open(normalized)
        this.$store.dispatch('setCurrentPage', 0)
      })

    this.unwatchCurrentPage = this.$store.watch((state, getters) => getters.currentPageIndexZeroBased,
      (newPage, oldPage) => {
        this.viewer.goToPage(newPage)
      })

    this.unwatchZonesOnCurrentPage = this.$store.watch((state, getters) => getters.zonesOnCurrentPage,
      (newArr, oldArr) => {
        this.renderZones()
      })

    this.unwatchMode = this.$store.watch((state, getters) => getters.mode,
      (newMode, oldMode) => {
        this.toggleSelection(newMode)
      })

    this.unwatchSelectedZone = this.$store.watch((state, getters) => getters.selectedZone,
      (newZone, oldZone) => {
        if (newZone !== null) {
          this.anno.setAnnotations([newZone])
          this.anno.selectAnnotation(newZone)
        }
      })
  },
  beforeUnmount () {
    this.unwatchPages()
    this.unwatchCurrentPage()
    this.unwatchZonesOnCurrentPage()
    this.unwatchSelectedZone()
    this.unwatchMode()
  }
}
</script>

<style lang="scss">
@import '@/css/_variables.scss';

$thinLineColor: #e5e5e566; // #ffffff33;
$thickLineColor: #cccccc66; // #ffffff99;

#osdContainer {
  height: calc(100vh - $appHeaderHeight - $appFooterHeight);
  height: calc(100dvh - #{$appHeaderHeight} - #{$appFooterHeight} - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  width: calc(100% - $appSidebarWidth - $contentPreviewPaneWidth);

  &.fullWidth {
    width: calc(100% - $appSidebarWidth);
  }

  float: left;
  box-shadow: 0 0 1rem #00000066 inset;

  background-color: #ffffff; // #8a8aff;
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
  background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
  background-image: linear-gradient($thickLineColor 2px, transparent 2px),
                    linear-gradient(90deg, $thickLineColor 2px, transparent 2px),
                    linear-gradient($thinLineColor 1px, transparent 1px),
                    linear-gradient(90deg, $thinLineColor 1px, transparent 1px);

  .a9s-annotationlayer.a9s-osd-annotationlayer.activeSelection {
    z-index: 12;
    // Let touch drags reach the drawing layer instead of being consumed as a
    // browser pan/scroll gesture (required for drawing on touch devices).
    touch-action: none;
    pointer-events: all;
  }

  .zone {
    background-color: rgba(255,255,255,.1);
    z-index: 10;

    .zoneLabel {
      text-align: center;
      position: absolute;
      top: calc(50% - 0.4rem);
      left: 0;
      right: 0;
      color: #000000;
      font-weight: 900;
      font-size: 0.8rem;
      line-height: 0.8rem;
    }
  }
}
</style>
