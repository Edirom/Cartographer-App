<template>
  <div class="modal modal-sm active">
    <a
      href="#close"
      class="modal-overlay"
      aria-label="Close"
      @click="closeModal"
    ></a>
    <div class="modal-container">
      <div class="modal-header">
        <a
          href="#close"
          class="btn btn-clear float-right"
          aria-label="Close"
          @click="closeModal"
        ></a>
        <div class="modal-title h5">Load IIIF</div>
      </div>
      <div class="modal-body">
        <div class="content">
          <div class="form-group">
            <label class="form-label" for="manifest-uri-input"
              >IIIF Manifest</label
            >
            <input
              class="form-input"
              type="url"
              id="manifest-uri-input"
              placeholder="URL"
            />
          </div>
          <div>
            <p>
              The given IIIF Manifest will be converted to an MEI file, holding
              the information relevant for the cartographer-app app.
            </p>
          </div>
          <div @click="useTestUri" :title="testUri" class="btn btn-sm">get test uri</div>
        </div>
      </div>
      <div class="modal-footer">
        <a class="btn btn" href="#close" @click="closeModal">Cancel</a>
        <button class="btn btn-primary" @click="main()">Import</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IIIFModal',
  data: () => ({
    testUri: 'https://api.beethovens-werkstatt.de/iiif/document/r24d1c005-acee-43a0-acfa-5dae796b7ec4/manifest.json'
  }),
  components: {},
  computed: {},
  methods: {
    useTestUri () {
      this.$el.querySelector('#manifest-uri-input').value = this.testUri
    },
    main () {
      const input = document.querySelector('#manifest-uri-input')
      if (input.validity.valid) {
        this.$store.dispatch('importIIIF', input.value)
        this.closeModal()
        this.$store.dispatch('resetAll')
      }
    },
    closeModal: function () {
      this.$store.dispatch('toggleLoadIIIFModal')
    }
  }
}
</script>

<style lang="scss" scoped>
.modal.modal-sm .modal-container {
  max-width: 360px;
}

.modal-container .modal-body {
  padding: 0 0.8rem;
}

.modal-container .modal-footer {
  padding: 0 0.8rem 0.8rem;
}

.prop {
  text-align: left;
  font-size: 0.7rem;
  margin-bottom: 0.5rem;

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
