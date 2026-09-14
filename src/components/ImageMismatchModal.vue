<template>
  <div v-if="showModal" class="modal modal-lg active">
    <a href="#close" class="modal-overlay" aria-label="Close" @click="closeModal"></a>
    <div class="modal-container">
      <div class="modal-header">
        <a href="#close" class="btn btn-clear float-right" aria-label="Close" @click="closeModal"></a>
        <div class="modal-title h5">⚠️ Image Mismatch Warning</div>
      </div>
      <div class="modal-body">
        <div class="content">
          <p v-if="missingImages.length > 0" class="text-warning">
            <strong>{{ missingImages.length }} image(s) referenced in the MEI file cannot be found:</strong>
          </p>
          
          <div v-if="missingImages.length > 0" class="missing-images-list">
            <div v-for="(image, index) in missingImages" :key="index" class="missing-image-item">
              <span class="badge badge-error">Missing</span>
              <code>{{ image }}</code>
            </div>
          </div>

          <p v-if="unreferencedImages.length > 0" class="text-info" style="margin-top: 20px;">
            <strong>{{ unreferencedImages.length }} image(s) loaded but not referenced in MEI:</strong>
          </p>
          
          <div v-if="unreferencedImages.length > 0" class="unreferenced-images-list">
            <div v-for="(image, index) in unreferencedImages" :key="index" class="unreferenced-image-item">
              <span class="badge badge-info">Unreferenced</span>
              <code>{{ image }}</code>
            </div>
          </div>

          <div class="info-box" style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-left: 4px solid #ff6b6b;">
            <p style="margin: 0; font-size: 0.9em;">
              <strong>What this means:</strong> The MEI file references images that are not available, or you have loaded images that are not referenced in the MEI file. This may cause issues when working with the application.
            </p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="cancelAndGoBack()">Cancel & Start Over</button>
        <button 
          v-if="unreferencedImages.length > 0 && missingImages.length === 0" 
          class="btn btn-primary" 
          @click="continueWithWarning()">
          Continue (Unreferenced images only)
        </button>
        <button 
          v-else-if="missingImages.length > 0" 
          class="btn btn-error" 
          disabled 
          title="Cannot continue - missing images must be resolved">
          ⚠️ Cannot Continue - Missing Images
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageMismatchModal',
  computed: {
    showModal() {
      return this.$store.state.showImageMismatchModal
    },
    missingImages() {
      return this.$store.state.missingImages || []
    },
    unreferencedImages() {
      return this.$store.state.unreferencedImages || []
    }
  },
  methods: {
    closeModal() {
      this.$store.dispatch('closeImageMismatchModal')
    },
    cancelAndGoBack() {
      // Close modal, reset the loaded data, and clear file inputs
      this.$store.dispatch('resetAll')
      this.$store.dispatch('closeImageMismatchModal')
      const meiInput = document.querySelector('#mei-file-input')
      const folderInput = document.querySelector('#images-folder-input')
      if (meiInput) meiInput.value = ''
      if (folderInput) folderInput.value = ''
    },
    continueWithWarning() {
      // Only continue if there are no missing images
      if (this.missingImages.length === 0) {
        this.closeModal()
      } else {
        // Should not be able to click this if there are missing images
        console.warn('Cannot continue - missing images detected')
      }
    }
  }
}
</script>

<style scoped>
.missing-image-item {
  padding: 8px;
  margin: 8px 0;
  background-color: #fff5f5;
  border-left: 3px solid #ff6b6b;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 2px;
}

.unreferenced-image-item {
  padding: 8px;
  margin: 8px 0;
  background-color: #f0f7ff;
  border-left: 3px solid #4dabf7;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 2px;
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.85em;
  word-break: break-all;
}

.text-warning {
  color: #ff6b6b;
}

.text-info {
  color: #4dabf7;
}

.badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.75em;
  font-weight: bold;
  white-space: nowrap;
}

.badge-error {
  background-color: #ff6b6b;
  color: white;
}

.badge-info {
  background-color: #4dabf7;
  color: white;
}

.info-box {
  border-radius: 2px;
}

.btn-error {
  background-color: #ff6b6b;
  border-color: #ff6b6b;
  color: white;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-error:hover {
  background-color: #ff6b6b;
  opacity: 0.6;
}
</style>
