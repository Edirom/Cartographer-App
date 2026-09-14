<template>
  <div class="modal modal-sm active">
    <a href="#close" class="modal-overlay" aria-label="Close" @click="closeModal"></a>
    <div class="modal-container">
      <div class="modal-header">
        <a href="#close" class="btn btn-clear float-right" aria-label="Close" @click="closeModal"></a>
        <div class="modal-title h5">{{ showSelectFolderModal ? 'Select Images Folder' : 'Load XML' }}</div>
      </div>
      <div class="modal-body">
        <div class="content">
          <div v-if="!showSelectFolderModal">
            <button class="btn btn-link" @click="testData()">Load test data</button>
            <input type="file" id="mei-file-input" accept=".xml, .mei" />
          </div>
          <div v-else>
            <p>This MEI file contains local image references.</p>
            <p>Please select the folder containing the images:</p>
          </div>
          <input type="file" id="images-folder-input" webkitdirectory style="display: none;" />
        </div>
      </div>
      <div class="modal-footer">
        <div v-if="!showSelectFolderModal">
          <button class="btn" @click="closeModal()">Cancel</button>
          <button class="btn btn-primary" @click="main()">Load</button>
        </div>
        <div v-else>
          <button class="btn" @click="cancelSelectFolder()">Cancel</button>
          <button class="btn btn-primary" @click="selectImagesFolder()">Select Folder</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import { convertLocalImagesToPages, sortImageFiles } from '@/tools/localImages.js'

const testUri = 'testfile.xml'

/**
 * A Parser for reading in the XML Document
 * @type {DOMParser}
 */
const parser = new DOMParser()

export default {
  name: 'XMLModal',
  components: {
  },
  computed: {
  },
  data() {
    return {
      currentMei: null,
      localImageTargets: [],
      showSelectFolderModal: false,
      loadedPages: [] // Keep references to pages to prevent blob URLs from being garbage collected
    }
  },
  mounted() {
    // Set up the folder input change handler once
    const folderInput = document.querySelector('#images-folder-input')
    if (folderInput) {
      folderInput.addEventListener('change', (e) => this.loadImagesFromFolder(e))
    }
  },
  methods: {
    testData () {
      fetch(testUri)
        .then(res => {
          return res.text()
        })
        .then(xml => {
          const mei = parser.parseFromString(xml, 'application/xml')
          this.$store.dispatch('setData', mei)
          this.closeModal()
        })
    },
    main () {
      const input = document.querySelector('#mei-file-input')
      const [file] = input.files
      if (file) {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
          const xml = reader.result
          const mei = parser.parseFromString(xml, 'application/xml')
          
          // Get all graphic elements and check for local image targets
          const graphicElements = mei.querySelectorAll('graphic')
          const imageTargets = []
          
          graphicElements.forEach(graphic => {
            const target = graphic.getAttribute('target')
            if (target && !target.startsWith('http')) {
              imageTargets.push(target)
            }
          })
          
          // If there are local images, show folder selection modal
          if (imageTargets.length > 0) {
            console.log('Local images found:', imageTargets)
            this.currentMei = mei
            this.localImageTargets = imageTargets
            this.showSelectFolderModal = true
          } else {
            // No local images, proceed normally
            console.log('No local images found')
            this.$store.dispatch('setData', mei)
            this.closeModal()
          }
        })
        reader.readAsText(file)
      }
    },
    selectImagesFolder() {
      console.log('selectImagesFolder called')
      const folderInput = document.querySelector('#images-folder-input')
      console.log('folderInput element:', folderInput)
      if (folderInput) {
        // Reset the value to ensure change event fires even if same folder is selected
        folderInput.value = ''
        folderInput.click()
        console.log('folderInput clicked')
      } else {
        console.error('Could not find #images-folder-input element')
      }
    },
    cancelSelectFolder() {
      console.log('cancelSelectFolder called')
      this.showSelectFolderModal = false
      this.currentMei = null
      this.localImageTargets = []
      // Don't clear loadedPages - keep them in memory to prevent blob URL garbage collection
      const meiInput = document.querySelector('#mei-file-input')
      if (meiInput) {
        meiInput.value = ''
      }
    },
    loadImagesFromFolder(event) {
      console.log('loadImagesFromFolder called with event:', event)
      const files = event.target.files
      console.log('Files from input:', files)
      const allFiles = Array.from(files)
      
      console.log('=== Loading Images from Folder ===')
      console.log('Image targets to find:', this.localImageTargets)
      console.log('Files in selected folder:', allFiles.map(f => f.webkitRelativePath || f.name))
      
      // Filter only image files
      const imageFiles = allFiles.filter(file => {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(file.name)
        console.log('Checking file:', file.name, 'is image?', isImage)
        return isImage
      })
      
      console.log('Image files found:', imageFiles.length, imageFiles.map(f => f.name))
      
      if (imageFiles.length > 0) {
        // Match files to image targets by path
        let filesToLoad = imageFiles
        
        if (this.localImageTargets && this.localImageTargets.length > 0) {
          console.log('Matching files to targets by path...')
          // Create a map of target paths to files — indexed by both full path and basename
          // so that MEI targets with or without a folder prefix (e.g. "images/foo.png" vs "foo.png") both match
          const fileMap = {}
          imageFiles.forEach(file => {
            const filePath = file.webkitRelativePath || file.name
            fileMap[filePath] = file
            const baseName = filePath.split('/').pop()
            if (!fileMap[baseName]) fileMap[baseName] = file
          })
          
          // Try to find files that match the targets
          filesToLoad = this.localImageTargets
            .map(target => {
              // Try full path first, then basename only
              const baseName = target.split('/').pop()
              const file = fileMap[target] || fileMap[baseName]
              if (file) {
                console.log(`✅ Found matching file for target: ${target}`)
                return file
              } else {
                console.warn(`⚠️ No matching file found for target: ${target}`)
                return null
              }
            })
            .filter(f => f !== null) // Remove unmatched targets
          
          // If not all targets were matched, warn user
          if (filesToLoad.length !== this.localImageTargets.length) {
            console.warn(`Found ${filesToLoad.length} of ${this.localImageTargets.length} expected images`)
          }
        } else {
          // No specific targets, sort all images by name
          filesToLoad = sortImageFiles(imageFiles)
        }
        
        console.log('Files to load:', filesToLoad.map(f => f.webkitRelativePath || f.name))
        
        if (filesToLoad.length > 0) {
          // Convert images to pages to get blob URLs and dimensions
          console.log('Calling convertLocalImagesToPages with', filesToLoad.length, 'files')
          convertLocalImagesToPages(filesToLoad)
            .then(async pages => {
              console.log('Converted pages:', pages)
              console.log('Number of pages converted:', pages.length)
              
              if (!pages || pages.length === 0) {
                throw new Error('No pages were converted from images')
              }
              
              // Keep references to pages in the component
              this.loadedPages = pages
              
              // Also store them in the Vuex store to prevent garbage collection of blob URLs
              this.$store.commit('SET_LOCAL_IMAGE_PAGES', pages)
              
              // Pass both pages and the original MEI (to preserve zones) to the action
              console.log('Dispatching addLocalImagePages action with original MEI')
              await this.$store.dispatch('addLocalImagePages', { pages, originalMei: this.currentMei })
              this.closeModal()
            })
            .catch(error => {
              console.error('Error loading images:', error)
              console.error('Stack:', error.stack)
              alert('Failed to load some images: ' + error.message)
            })
        } else {
          alert('No matching image files found for the MEI targets')
          this.cancelSelectFolder()
        }
      } else {
        console.log('No image files found in selected folder')
        alert('No image files found in the selected folder')
        this.cancelSelectFolder()
      }
    },
    closeModal: function () {
      console.log('closeModal called')
      this.showSelectFolderModal = false
      this.currentMei = null
      this.localImageTargets = []
      // Keep loadedPages in Vuex store - don't clear the component reference
      // The blob URLs in state.localImagePages will keep them alive
      const meiInput = document.querySelector('#mei-file-input')
      if (meiInput) {
        meiInput.value = ''
      }
      this.$store.dispatch('toggleLoadXMLModal')
    }
  }
}
</script>

<style lang="scss" scoped>

.modal.modal-sm .modal-container {
  max-width: 360px;
}

.modal-container .modal-body {
    padding: 0 .8rem;
}

.modal-container .modal-footer {
  padding: 0 .8rem .8rem;
}

.prop {
  text-align: left;
  font-size: .7rem;
  margin-bottom: .5rem;

  .desc {
    display: block;
  }

  .value {
    display: block;
    color: #999999;
  }
}

.customFormGroup {
  position: relative;
}
</style>
