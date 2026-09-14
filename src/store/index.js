import { createStore } from 'vuex'
import authModule from '@/store/modules/auth.js'
import notificationsModule from '@/store/modules/notifications.js'
import { iiifManifest2mei, checkIiifManifest, getPageArray } from '@/tools/iiif.js'
import { meiZone2annotorious, annotorious2meiZone, measureDetector2meiZone, generateMeasure, insertMeasure, deleteZone, setMultiRest, createNewMdiv, moveContentToMdiv, toggleAdditionalZone, addImportedPage, findZoneInsertionPositionForXmlZone, createAdditionalZone } from '@/tools/meiMappings.js'
import { uuid } from '@/tools/uuid.js'

import { mode as allowedModes } from '@/store/constants.js'

const MAX_HISTORY = 50  // Maximum number of undo states to keep
const parser = new DOMParser()
const serializer = new XMLSerializer()

function revokeBlobUrls (urlMap) {
  if (!urlMap) return
  Object.keys(urlMap).forEach(url => {
    try {
      URL.revokeObjectURL(url)
    } catch (_) {
      // Ignore invalid or already revoked URLs.
    }
  })
}

function parseGithubRawUrl (target) {
  if (typeof target !== 'string') return null
  const match = target.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/)
  if (!match) return null
  return {
    owner: match[1],
    repo: match[2],
    ref: match[3],
    path: match[4],
  }
}

/**
 * Helper function to format XML with proper indentation
 * @param {string} xmlString - Raw XML string from serializer
 * @returns {string} Formatted XML with indentation
 */
const formatXml = (xmlString) => {
  const tab = '  '
  let formatted = ''
  let indent = 0
  
  // Split on tags and process
  xmlString.match(/(<[^>]+>|[^<]+)/g)?.forEach(node => {
    node = node.trim()
    if (!node) return
    
    // Skip text nodes that are only whitespace
    if (!node.startsWith('<')) return
    
    // Closing tag - decrease indent before adding
    if (node.startsWith('</')) {
      indent = Math.max(0, indent - 1)
      formatted += tab.repeat(indent) + node + '\n'
    }
    // Self-closing or opening tag
    else if (node.endsWith('/>')) {
      formatted += tab.repeat(indent) + node + '\n'
    }
    // Opening tag - add then increase indent
    else if (node.startsWith('<') && !node.startsWith('<?')) {
      formatted += tab.repeat(indent) + node + '\n'
      indent++
    }
    // XML declaration
    else {
      formatted += node + '\n'
    }
  })
  
  return formatted.trim()
}

let historySaveTimeout = null  // For debouncing history saves

/**
 * Helper function to save current xmlDoc state to history
 * Debounced to prevent multiple saves within 50ms (batches changes from multiple mutations)
 * @param {Object} state - Vuex state
 */
function saveToHistory(state) {
  if (state.xmlDoc === null) return
  
  // Clear any pending save
  if (historySaveTimeout) {
    clearTimeout(historySaveTimeout)
  }
  
  // Schedule save for after other mutations finish
  historySaveTimeout = setTimeout(() => {
    // Remove any future states if we're not at the end of history
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1)
    }
    
    // Save current state and move history pointer forward
    state.history.push(state.xmlDoc.cloneNode(true))
    state.historyIndex = state.history.length - 1
    
    // Limit history size to prevent memory bloat
    if (state.history.length > MAX_HISTORY) {
      state.history.shift()
      state.historyIndex--
    }
    
    historySaveTimeout = null
  }, 50)
}

function getDefaultState() {
  return {
      xmlDoc: null,                  // The loaded MEI XML document (DOM)
      currentMdiv: null,            // The currently selected movement (mdiv)
      nextMdiv: null,                // The next mdiv to be created (if applicable)  
      previousMdiv: null,            // The previous mdiv (if applicable)
      pages: [],                     // Array of page objects (from MEI or IIIF)
      currentPage: -1,               // Index of the currently selected page
      history: [],                   // Array of xmlDoc states for undo/redo
      historyIndex: -1,              // Current position in history
      showLoadXMLModal: false,       // Show/hide modal for loading XML files
      showLoadIIIFModal: false,      // Show/hide modal for loading IIIF manifests
      showLoadLocalImage: false,     // Show/hide modal for loading local images
      showMeasureModal: false,       // Show/hide modal for editing measure labels/numbers
      showMdivModal: false,          // Show/hide modal for movement (mdiv) management
      showPagesModal: false,         // Show/hide modal for page management
      showPageImportModal: false,    // Show/hide modal for importing pages/images
      showAboutModal: false,         // Show/hide the About/info modal
      showMeasureList: false,        // Show/hide the measure list panel
      loading: false,                // Indicates if the app is currently loading data
      processing: false,             // Indicates if the app is processing data
      pageDimension: [],             // Array of [width, height] for each page
      mode: allowedModes.selection,  // Current editor mode (selection, manualRect, etc.)
      existingMusicMode: false,      // True if working with existing music content
      selectedZoneId: null,          // xml:id of the currently selected zone
      hoveredZoneId: null,           // xml:id of the currently hovered zone
      currentMdivId: null,           // xml:id of the currently selected mdiv
      totalZones: 0,                 // Total number of zones in the document
      resultingArray: [],            // Generic array for storing results (usage varies)
      deleteZoneId: null,            // xml:id of the zone to be deleted
      anno: null,                    // Current annotation object (Annotorious)
      canvases: [],                  // IIIF canvases (if loaded)
      importingImages: [],           // Array of images being imported (with status)
      currentMeasureId: null,        // xml:id of the currently selected measure
      infoJson: [],                   // Array of IIIF info.json URLs for canvases
      newFirstMeasure: "",            // The first measure of the old mdiv for selecting a new mdiv
      oldMdiv : null,                 // The old mdiv that is being moved from  
      selectedMdiv: null,             // The mdiv that is selected in the mdiv modal
      currentMdiv: null,              // The current mdiv that contains the current measure
      insertMdivup: false,            // True if the new mdiv is to be inserted before the current mdiv
      currentMeasure: null,           // The current measure object 
      additionMeasure: false,         // True if an additional measure is being added (to prevent recursion)
      showLoadGitModal: false,        // Show/hide modal for loading from GitHub
      showCommitModal: false,         // Show/hide modal for committing to GitHub
      githubFile: null,               // Currently loaded GitHub file { owner, repo, path, sha }
      importedGithubUrlMap: null,     // Blob URL map for locally uploaded GitHub image MEIs
      localImagePages: [],            // Store references to local image pages to prevent garbage collection of blob URLs
      showImageMismatchModal: false,  // Show/hide modal for image mismatch warnings
      missingImages: [],              // Array of image paths referenced in MEI but not found
      unreferencedImages: [],         // Array of loaded images not referenced in MEI
      originalMeiGraphicCount: 0,     // Store original MEI's graphic count for verification
  }
}

export default createStore({
  modules: {
    auth: authModule,
    notifications: notificationsModule,
  },
    state: getDefaultState(),
  /**
 * Vuex mutations for managing application state.
 * Each mutation updates a specific part of the state in response to actions or UI events.
 *
 * - RESET_STATE: Resets the entire application state to its default values.
 * - TOGGLE_LOADXML_MODAL: Toggle the visibility of the XML file load modal.
 * - TOGGLE_LOADIIIF_MODAL: Toggle the visibility of the IIIF manifest load modal.
 * - TOGGLE_MEASURE_MODAL: Toggle the visibility of the measure label/number modal.
 * - TOGGLE_PAGES_MODAL: Toggle the visibility of the page management modal.
 * - TOGGLE_PAGE_IMPORT_MODAL: Toggle the visibility of the page/image import modal.
 * - TOGGLE_MDIV_MODAL: Toggle the visibility of the movement (mdiv) management modal.
 * - HIDE_MODALS: Hide both the measure and mdiv modals.
 * - TOGGLE_MEASURE_LIST: Toggle the visibility of the measure list panel.
 * - SET_ANNO: Set the current annotation object.
 * - SET_XML_DOC: Set the loaded MEI XML document and reset the current page to 0.
 * - SET_PAGES: Set the array of page objects.
 * - SET_CURRENT_PAGE: Set the index of the currently selected page.
 * - SET_TOTAL_ZONES_COUNT: Increment the total number of zones by a given value.
 * - SET_LOADING: Set the loading state (true/false).
 * - SET_PROCESSING: Set the processing state (true/false).
 * - SELECT_ZONE: Set the xml:id of the currently selected zone.
 * - HOVER_ZONE: Set the xml:id of the currently hovered zone.
 * - CREATE_ZONE_FROM_ANNOTORIOUS: Create a new zone from an Annotorious annotation and update the MEI document accordingly.
 * - CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE: Create zones from detected rectangles and update the MEI document.
 * - UPDATE_ZONE_FROM_ANNOTORIOUS: Update an existing zone's coordinates from an Annotorious annotation.
 * - SET_MODE: Set the current editor mode.
 * - TOGGLE_EXISTING_MUSIC_MODE: Toggle whether the app is in existing music mode.
 * - SET_CURRENT_MEASURE_ID: Set the xml:id of the currently selected measure.
 * - SET_CURRENT_MEASURE_LABEL: Set or remove the label of the current measure.
 * - SET_CURRENT_MEASURE_MULTI_REST: Set, update, or remove a multiRest element in the current measure.
 * - SET_PAGE_LABEL: Set the label for a specific page.
 * - SET_CURRENT_MDIV_LABEL: Set the label for the current mdiv.
 * - CREATE_NEW_MDIV: Create a new mdiv and move content to it.
 * - SELECT_MDIV: Move content to a selected mdiv and update the current mdiv id.
 * - SET_CURRENT_MDIV: Set the xml:id of the currently selected mdiv.
 * - REGISTER_IMAGE_IMPORT: Register an image being imported (with status).
 * - RECEIVE_IMAGE_IMPORT: Mark an image import as successful and store its dimensions.
 * - FAILED_IMAGE_IMPORT: Mark an image import as failed.
 * - ACCEPT_IMAGE_IMPORTS: Add all successfully imported images as pages to the MEI document.
 * - CANCEL_IMAGE_IMPORTS: Cancel all pending image imports and hide the import modal.
 * - CURRENT_MDIV: Set the current mdiv object.
 * - NEXT_MDIV: Set the next mdiv object.
 * - PREVIOUS_MDIV: Set the previous mdiv object.
 */
  mutations: {
    RESET_STATE(state) {
        Object.assign(state, getDefaultState())
      },
    UNDO(state) {
      if (state.historyIndex > 0) {
        state.historyIndex--
        state.xmlDoc = state.history[state.historyIndex].cloneNode(true)
      }
    },
    REDO(state) {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.xmlDoc = state.history[state.historyIndex].cloneNode(true)
      }
    },
    TOGGLE_LOADXML_MODAL(state) {
      state.showLoadXMLModal = !state.showLoadXMLModal
    },
    TOGGLE_LOADIIIF_MODAL(state) {
      state.showLoadIIIFModal = !state.showLoadIIIFModal
    },
    TOGGLE_LOADGIT_MODAL(state) {
      state.showLoadGitModal = !state.showLoadGitModal
    },
    TOGGLE_COMMIT_MODAL(state) {
      state.showCommitModal = !state.showCommitModal
    },
    TOGGLE_LOADLOCALIMAGE_MODAL(state, value) {
      if (value !== undefined) {
        state.showLoadLocalImage = value
      } else {
        state.showLoadLocalImage = !state.showLoadLocalImage
      }
    },
    TOGGLE_MEASURE_MODAL(state) {
      state.showMeasureModal = !state.showMeasureModal
    },
    TOGGLE_PAGES_MODAL(state) {
      state.showPagesModal = !state.showPagesModal
    },
    TOGGLE_PAGE_IMPORT_MODAL(state) {
      state.showPageImportModal = !state.showPageImportModal
    },
    TOGGLE_MDIV_MODAL(state) {
      state.showMdivModal = !state.showMdivModal
    },
    TOGGLE_ABOUT_MODAL(state) {
      state.showAboutModal = !state.showAboutModal
    },
    HIDE_MODALS(state) {
      state.showMeasureModal = false
      state.showMdivModal = false
      state.showLoadLocalImage = false
    },
    TOGGLE_MEASURE_LIST(state) {
      state.showMeasureList = !state.showMeasureList
    },
    SET_ANNO(state, anno) {
      state.anno = anno
    },
    SET_GITHUB_FILE(state, fileInfo) {
      state.githubFile = fileInfo
    },
    CLEAR_GITHUB_FILE(state) {
      state.githubFile = null
    },
    SET_IMPORTED_GITHUB_URL_MAP(state, urlMap) {
      state.importedGithubUrlMap = urlMap
    },
    CLEAR_IMPORTED_GITHUB_URL_MAP(state) {
      state.importedGithubUrlMap = null
    },
    SET_XML_DOC(state, xmlDoc) {
      state.xmlDoc = xmlDoc
      state.currentPage = 0
      // Initialize history when loading new XML document
      state.history = [xmlDoc.cloneNode(true)]
      state.historyIndex = 0
    },
    SET_PAGES(state, pageArray) {
      state.pages = pageArray
    },
    SET_LOCAL_IMAGE_PAGES(state, pages) {
      // Store references to local image pages to prevent blob URL garbage collection
      state.localImagePages = pages
    },
    SET_CURRENT_PAGE(state, i) {
      if (i > -1 && i < state.pages.length) {
        state.currentPage = i
      }
    },
    SET_TOTAL_ZONES_COUNT(state, j) {
      state.totalZones = state.totalZones + j
    },
    SET_LOADING(state, bool) {
      state.loading = bool
    },
    SET_PROCESSING(state, bool) {
      state.processing = bool
    },
    SELECT_ZONE(state, id) {
      state.selectedZoneId = id
    },
    HOVER_ZONE(state, id) {
      state.hoveredZoneId = id
    },
    CREATE_ZONE_FROM_ANNOTORIOUS(state, annot) {

      if (state.mode !== allowedModes.selection) {
        saveToHistory(state)
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const index = state.currentPage + 1
        const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')')

        const zone = annotorious2meiZone(annot)
        surface.appendChild(zone)
        const measure = generateMeasure()
        if (state.existingMusicMode) {

          // standard mode -> add zone to first measure without zone
          if (state.mode === allowedModes.manualRect) {
            const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])')
            if (lastMeasureWithoutZone !== null) {
              state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id')
              lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
            }
          } else if (state.mode === allowedModes.additionalZone) {
            state.additionMeasure = true
            insertMeasure(xmlDoc, measure, state, zone, state.currentPage)
            state.additionMeasure = false
          }
        } else {
          // standard mode -> create new measure for zone
          if (state.mode === allowedModes.manualRect) {
            measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
            insertMeasure(xmlDoc, measure, state, zone, state.currentPage)
            // add zone to last existing measure in file
          } else if (state.mode === allowedModes.additionalZone && state.selectedZoneId === null) {
            state.additionMeasure = true
            insertMeasure(xmlDoc, measure, state, zone, state.currentPage)
            state.additionMeasure = false
           }
        }

        state.xmlDoc = xmlDoc
        
      }
    },
    CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE(state, { rects, pageIndex }) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const index = pageIndex + 1 // pageIndex is expected to be zero-based
      const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')')

      rects.forEach(rect => {
        const zone = measureDetector2meiZone(rect)
        surface.appendChild(zone)
        if (!state.existingMusicMode) {
          const measure = generateMeasure()
          measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
          insertMeasure(xmlDoc, measure, state, zone, pageIndex)
        } else {
          const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])')
          if (lastMeasureWithoutZone !== null) {
            state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id')
            lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
          }
        }
      })

      state.xmlDoc = xmlDoc
    },
    UPDATE_ZONE_FROM_ANNOTORIOUS(state, annot) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const newZone = annotorious2meiZone(annot)

      const pageIndex = state.currentPage + 1
      const surface = xmlDoc.querySelector('surface:nth-child(' + pageIndex + ')')
      const zones = surface.querySelectorAll('zone')
      const existingZone = [...zones].find(zone => zone.getAttribute('xml:id') === newZone.getAttribute('xml:id'))

      existingZone.setAttribute('ulx', newZone.getAttribute('ulx'))
      existingZone.setAttribute('uly', newZone.getAttribute('uly'))
      existingZone.setAttribute('lrx', newZone.getAttribute('lrx'))
      existingZone.setAttribute('lry', newZone.getAttribute('lry'))

      state.xmlDoc = xmlDoc
    },
    SET_MODE(state, mode) {
      if (mode in allowedModes) {
        state.mode = mode
      }
    },
    TOGGLE_EXISTING_MUSIC_MODE(state) {
      state.existingMusicMode = !state.existingMusicMode
    },
    SET_CURRENT_MEASURE_ID(state, id) {
      if (id === null) {
        state.currentMeasureId = null
      } else {
        let measure = [...state.xmlDoc.querySelectorAll('measure')].find(measure => measure.getAttribute('xml:id') === id)
        if (measure === undefined) {
          measure = state.xmlDoc.querySelector('measure[facs~="#' + id + '"]')
        }
        state.currentMeasureId = measure.getAttribute('xml:id')
      }
    },
    SET_CURRENT_MEASURE_LABEL(state, val) {
      if (!state.currentMeasureId) return;

      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true);
      const measure = [...xmlDoc.querySelectorAll('measure')]
        .find(m => m.getAttribute('xml:id') === state.currentMeasureId);
      if (!measure) return;

      if (val == null) {
        measure.removeAttribute('label');
      } else {
        measure.setAttribute('label', String(val));
      }

      state.xmlDoc = xmlDoc; // commit the modified clone
    },
    SET_CURRENT_MEASURE_MULTI_REST(state, val) {
      if (state.currentMeasureId !== null) {
        saveToHistory(state)
        const xmlDoc = state.xmlDoc.cloneNode(true);
        const measure = [...xmlDoc.querySelectorAll('measure')]
          .find(m => m.getAttribute('xml:id') === state.currentMeasureId);
        if (measure) setMultiRest(measure, val);
        state.xmlDoc = xmlDoc; // replace state with the modified clone
      }
    },
    SET_PAGE_LABEL(state, { index, val }) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const surface = xmlDoc.querySelectorAll('surface')[index]
      surface.setAttribute('label', val)
      state.xmlDoc = xmlDoc
    },
    SET_CURRENT_MDIV_LABEL(state, val) {
      if (state.currentMdivId !== null && state.xmlDoc !== null) {
        saveToHistory(state)
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const mdivs = [...xmlDoc.querySelectorAll('mdiv')]
        const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)

        mdiv.setAttribute('label', val)

        state.xmlDoc = xmlDoc
      }
    },
    CREATE_NEW_MDIV(state) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      state.currentMdivId = createNewMdiv(xmlDoc, state.currentMdivId)

      moveContentToMdiv(xmlDoc, state.currentMeasureId, state.currentMdivId, state)

      state.xmlDoc = xmlDoc
    },
    SELECT_MDIV(state, selectedMdiv) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')]
        state.currentMdiv = mdivs.find(mdiv => {
        const measures = Array.from(mdiv.getElementsByTagName('measure'));
        return measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId);
      });
       state.selectedMdiv = mdivs.find(mdiv =>mdiv.getAttribute("xml:id") === selectedMdiv)

      
      if (state.currentMeasureId !== null) {
        saveToHistory(state)
        moveContentToMdiv(xmlDoc, state.currentMeasureId, selectedMdiv, state)
        state.currentMdivId = selectedMdiv
        state.xmlDoc = xmlDoc
      }
    },
    SET_CURRENT_MDIV(state, id) {
      state.currentMdivId = id
    },
    REGISTER_IMAGE_IMPORT(state, { url, index }) {
      state.importingImages[index] = { index, url, width: null, height: null, status: 'loading' }
    },
    RECEIVE_IMAGE_IMPORT(state, { url, index, json }) {
      state.importingImages[index].status = 'success'
      state.importingImages[index].width = json.width
      state.importingImages[index].height = json.height
    },
    FAILED_IMAGE_IMPORT(state, { url, index }) {
      state.importingImages[index].status = 'failed'
    },
    ACCEPT_IMAGE_IMPORTS(state) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      state.importingImages.forEach(page => {
        addImportedPage(xmlDoc, page.index, page.url, page.width, page.height)
      })
      const pageArray = getPageArray(xmlDoc, state)
      state.pages = pageArray
      state.importingImages = []
      state.showPagesImportModal = false
      state.xmlDoc = xmlDoc
    },
    DELETE_ZONE(state, id) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      deleteZone(xmlDoc, id, state)
      state.xmlDoc = xmlDoc
    },
    TOGGLE_ADDITIONAL_ZONE(state, id) {
      saveToHistory(state)
      const xmlDoc = state.xmlDoc.cloneNode(true)
      toggleAdditionalZone(xmlDoc, id, state)
      state.xmlDoc = xmlDoc
    },
    CANCEL_IMAGE_IMPORTS(state) {
      state.importingImages = []
      state.showPagesImportModal = false
    },
    CURRENT_MDIV(state, mdiv) {
      state.currentMdiv = mdiv
    },
    NEXT_MDIV(state, mdiv) {
      state.nextMdiv = mdiv
    },
    PREVIOUS_MDIV(state, mdiv) {
      state.previousMdiv = mdiv
    },
    TOGGLE_IMAGE_MISMATCH_MODAL(state) {
      state.showImageMismatchModal = !state.showImageMismatchModal
    },
    SET_IMAGE_MISMATCHES(state, { missing, unreferenced }) {
      state.missingImages = missing || []
      state.unreferencedImages = unreferenced || []
    },
    SHOW_IMAGE_MISMATCH_MODAL(state, { missing, unreferenced }) {
      state.missingImages = missing || []
      state.unreferencedImages = unreferenced || []
      state.showImageMismatchModal = true
    },
    HIDE_IMAGE_MISMATCH_MODAL(state) {
      state.showImageMismatchModal = false
      state.missingImages = []
      state.unreferencedImages = []
    }
  },
  /**
 * Vuex actions for asynchronous operations and complex state updates.
 * Actions can dispatch mutations, perform async tasks, and coordinate multiple state changes.
 *
 * - resetAll: Resets the entire application state to its default values.
 * - toggleLoadXMLModal: Toggles the visibility of the XML file load modal.
 * - toggleLoadIIIFModal: Toggles the visibility of the IIIF manifest load modal.
 * - toggleMeasureModal: Toggles the visibility of the measure label/number modal.
 * - togglePagesModal: Toggles the visibility of the page management modal.
 * - togglePageImportModal: Toggles the visibility of the page/image import modal.
 * - toggleMdivModal: Toggles the visibility of the movement (mdiv) management modal.
 * - toggleMeasureList: Toggles the visibility of the measure list panel.
 * - setCurrentPage: Sets the currently selected page index.
 * - setCurrentPageZone: Updates the total number of zones on the current page.
 * - importIIIF: Imports a IIIF manifest, fetches image info, and converts to MEI (two implementations: sequential and concurrent).
 * - importXML: Loads an MEI XML file and parses it into the application state.
 * - autoDetectZonesOnCurrentPage: Sends the current page image to a remote service for automatic measure detection.
 * - autoDetectZonesOnAllPage: Runs automatic measure detection for all pages.
 * - setData: Sets the MEI document and updates related state (pages, processing, modals).
 * - selectZone: Selects a zone by xml:id.
 * - clickZone: Handles zone click events (deletion or additional zone logic).
 * - clickMeasureLabel: Opens the measure label/number modal for a measure.
 * - closeMeasureNumberModal: Closes the measure label/number modal.
 * - hoverZone: Sets the currently hovered zone.
 * - unhoverZone: Clears the hovered zone if it matches the given id.
 * - createZone: Creates a new zone from an annotation.
 * - deleteZone: Deletes a zone by xml:id.
 * - updateZone: Updates a zone's coordinates from an annotation.
 * - setMode: Sets the current editor mode.
 * - toggleExistingMusicMode: Toggles whether the app is in existing music mode.
 * - setCurrentMeasureLabel: Sets or removes the label for the current measure.
 * - setCurrentMeasureMultiRest: Sets, updates, or removes a multiRest element in the current measure.
 * - setPageLabel: Sets the label for a specific page.
 * - setCurrentMdiv: Sets the currently selected mdiv by xml:id.
 * - setCurrentMdivLabel: Sets the label for the current mdiv.
 * - createNewMdiv: Creates a new mdiv and moves content to it.
 * - selectMdiv: Moves content to a selected mdiv and updates the current mdiv id.
 * - registerImageImports: Registers images for import and fetches their info.json data.
 * - acceptImageImports: Adds all successfully imported images as pages to the MEI document.
 * - cancelImageImports: Cancels all pending image imports and hides the import modal.
 */
  actions: {
    async revokeGithubBlobUrls({ state, commit }) {
      if (state.githubFile && state.githubFile.urlMap) {
        revokeBlobUrls(state.githubFile.urlMap)
      }
      if (state.importedGithubUrlMap) {
        revokeBlobUrls(state.importedGithubUrlMap)
        commit('CLEAR_IMPORTED_GITHUB_URL_MAP')
      }
      commit('CLEAR_GITHUB_FILE')
    },
    async resolveLocalGithubImageUrls({ state, commit, dispatch }, mei) {
      const graphics = [...mei.querySelectorAll('graphic[target]')]
      const urlMap = {}
      await Promise.all(graphics.map(async graphic => {
        const target = graphic.getAttribute('target')
        const parsed = parseGithubRawUrl(target)
        if (!parsed) return
        try {
          let blob
          if (state.auth && state.auth.accessToken) {
            const repo = { owner: parsed.owner, name: parsed.repo }
            const { bytes, name } = await dispatch('auth/getImageContent', { repo, path: parsed.path })
            const ext = name.split('.').pop().toLowerCase()
            const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
              : ext === 'png' ? 'image/png'
              : ext === 'gif' ? 'image/gif'
              : ext === 'webp' ? 'image/webp'
              : 'application/octet-stream'
            blob = new Blob([bytes], { type: mime })
          } else {
            const response = await fetch(target)
            if (!response.ok) throw new Error(`Failed to fetch ${target}: ${response.status}`)
            blob = await response.blob()
          }
          const blobUrl = URL.createObjectURL(blob)
          graphic.setAttribute('target', blobUrl)
          urlMap[blobUrl] = target
        } catch (e) {
          console.warn(`Unable to resolve GitHub image URL ${target}:`, e)
        }
      }))
      if (Object.keys(urlMap).length > 0) {
        commit('SET_IMPORTED_GITHUB_URL_MAP', urlMap)
      } else {
        commit('CLEAR_IMPORTED_GITHUB_URL_MAP')
      }
    },
    async resetAll({ dispatch, commit }) {
      await dispatch('revokeGithubBlobUrls')
      commit('RESET_STATE')
    },
    undo({ commit }) {
      commit('UNDO')
    },
    redo({ commit }) {
      commit('REDO')
    },
    toggleLoadXMLModal({ commit }) {
      commit('TOGGLE_LOADXML_MODAL')
    },
    toggleLoadIIIFModal({ commit }) {
      commit('TOGGLE_LOADIIIF_MODAL')
    },
    toggleLoadLocalImage({ commit }) {
      commit('TOGGLE_LOADLOCALIMAGE_MODAL')
    },
    toggleMeasureModal({ commit }) {
      commit('TOGGLE_MEASURE_MODAL')
    },
    togglePagesModal({ commit }) {
      commit('TOGGLE_PAGES_MODAL')
    },
    togglePageImportModal({ commit }) {
      commit('TOGGLE_PAGE_IMPORT_MODAL')
    },
    toggleMdivModal({ commit }) {
      commit('TOGGLE_MDIV_MODAL')
    },
    toggleMdivModal({ commit }) {
      commit('TOGGLE_MDIV_MODAL')
    },
    toggleAboutModal({ commit }) {
      commit('TOGGLE_ABOUT_MODAL')
    },
    toggleLoadGitModal ({ commit }) {
      commit('TOGGLE_LOADGIT_MODAL')
    },
    toggleMeasureList({ commit }) {
      commit('TOGGLE_MEASURE_LIST')
    },
    async addLocalImagePages({ commit, dispatch, state }, input) {
      // Handle both old format (pages directly) and new format ({pages, originalMei})
      // NOTE: do NOT fall back to state.xmlDoc — local image loads are always a fresh
      // start and should never be validated against a previously-loaded MEI.
      const pages = input.pages || input
      const originalMei = input.originalMei || null
      
      // Check if no images were selected
      if (!pages || pages.length === 0) {
        commit('SET_LOADING', false)
        commit('SET_PROCESSING', false)
        commit('SHOW_IMAGE_MISMATCH_MODAL', { 
          missing: ['No images were selected from the folder'], 
          unreferenced: [] 
        })
        return
      }
      
      // Store the original MEI's graphic count for verification
      const originalGraphicCount = originalMei ? originalMei.querySelectorAll('graphic').length : 0
      state.originalMeiGraphicCount = originalGraphicCount
      
      // Import uuid utility for consistent ID generation with IIIF
      const { uuid } = await import('@/tools/uuid.js')
      
      // Create a complete MEI document with proper facsimile structure for local images
      // This ensures consistency with IIIF-generated MEI files
      const parser = new DOMParser()
      
      // Load the standard MEI template to ensure consistency with IIIF
      let xmlDoc
      try {
        // Try to fetch template with correct path
        const base = (process.env.BASE_URL || '/').replace(/\/$/, '')
        const templateUrl = `${base}/assets/meiFileTemplate.xml`
        const templateResponse = await fetch(templateUrl)
        if (!templateResponse.ok) {
          throw new Error(`Template fetch failed: ${templateResponse.status}`)
        }
        const templateText = await templateResponse.text()
        xmlDoc = parser.parseFromString(templateText, 'text/xml')
      } catch (e) {
        console.warn('Could not load MEI template, using fallback:', e.message)
        // Fallback: create MEI structure matching the standard template
        const title = originalMei?.querySelector('meiHead titleStmt > title')?.textContent || 'Local Images'
        const meiTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="http://www.w3.org/2000/svg" meiversion="5.0.0-dev">
  <meiHead>
    <fileDesc>
      <titleStmt>
        <title>${title}</title>
      </titleStmt>
      <pubStmt/>
    </fileDesc>
  </meiHead>
  <music>
    <facsimile></facsimile>
    <body></body>
  </music>
</mei>`
        xmlDoc = parser.parseFromString(meiTemplate, 'text/xml')
      }
      
      // Set or update title in meiHead (with null checking)
      const titleElem = xmlDoc.querySelector('meiHead titleStmt > title')
      if (titleElem) {
        if (originalMei) {
          const originalTitle = originalMei.querySelector('meiHead titleStmt > title')?.textContent
          if (originalTitle) {
            titleElem.textContent = originalTitle
          }
        } else if (!titleElem.textContent) {
          titleElem.textContent = 'Local Images'
        }
      }
      
      // Set root MEI element attributes to match IIIF format
      const rootMei = xmlDoc.documentElement
      rootMei.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', 'm' + uuid())
      
      // Ensure music element has meiversion attribute
      const musicElem = xmlDoc.querySelector('music')
      if (musicElem && !musicElem.getAttribute('meiversion')) {
        musicElem.setAttribute('meiversion', '5.0.0-dev')
      }
      
      // Extract surface IDs for pb references
      const surfaceIds = []
      
      // Add surfaces with proper UUID-based IDs and coordinate attributes
      const facsimile = xmlDoc.querySelector('facsimile')
      if (!facsimile) {
        console.error('MEI document missing facsimile element')
        return
      }
      
      pages.forEach((page, index) => {
        const surfaceId = 's' + uuid()
        const graphicId = 'g' + uuid()
        surfaceIds.push(surfaceId)
        
        const surface = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'surface')
        surface.setAttribute('xml:id', surfaceId)
        surface.setAttribute('n', (index + 1).toString())
        surface.setAttribute('ulx', '0')
        surface.setAttribute('uly', '0')
        surface.setAttribute('lrx', (page.width || 0).toString())
        surface.setAttribute('lry', (page.height || 0).toString())
        surface.setAttribute('label', (index + 1).toString())
        
        // Use the original file path (preserves folder structure) for MEI storage
        // Fallback to imageName for compatibility with images loaded without paths
        const target = page.filePath || page.uri || page.imageName || page.imageUrl || `image${index + 1}.jpg`
        
        const graphic = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'graphic')
        graphic.setAttribute('xml:id', graphicId)
        graphic.setAttribute('target', target)
        graphic.setAttribute('type', 'facsimile')
        graphic.setAttribute('width', (page.width || 0).toString())
        graphic.setAttribute('height', (page.height || 0).toString())
        
        surface.appendChild(graphic)
        
        // Merge zones from original surfaces if they exist
        if (originalMei) {
          const originalSurfaces = originalMei.querySelectorAll('surface')
          if (index < originalSurfaces.length) {
            const originalSurface = originalSurfaces[index]
            const zones = originalSurface.querySelectorAll('zone')
            zones.forEach(zone => {
              const clonedZone = xmlDoc.importNode(zone, true)
              surface.appendChild(clonedZone)
            })
          }
        }
        
        facsimile.appendChild(surface)
      })
      
      // Build body content: use original MEI's body if available, otherwise create default
      const body = xmlDoc.querySelector('body')
      if (!body) {
        console.error('MEI document missing body element')
        return
      }
      
      body.innerHTML = ''
      
      if (originalMei) {
        const originalBody = originalMei.querySelector('body')
        if (originalBody && originalBody.innerHTML.trim()) {
          body.innerHTML = originalBody.innerHTML
        }
      }
      
      // If no body content, create default with pb elements referencing surfaces
      if (!body.innerHTML.trim()) {
        const mdiv = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'mdiv')
        mdiv.setAttribute('xml:id', 'm' + uuid())
        mdiv.setAttribute('label', 'Movement 1')
        mdiv.setAttribute('n', '1')
        
        const score = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'score')
        const section = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'section')
        
        // Add page breaks referencing the surfaces by their UUID-based IDs
        surfaceIds.forEach((surfaceId, index) => {
          const pb = xmlDoc.createElementNS('http://www.music-encoding.org/ns/mei', 'pb')
          pb.setAttribute('facs', '#' + surfaceId)
          pb.setAttribute('n', (index + 1).toString())
          section.appendChild(pb)
        })
        
        score.appendChild(section)
        mdiv.appendChild(score)
        body.appendChild(mdiv)
      }
      
      // Verify image filenames match MEI graphic targets (by basename, ignoring folder prefix)
      if (originalMei) {
        const basename = p => p.split('/').pop()
        const meiTargets = Array.from(originalMei.querySelectorAll('graphic'))
          .map(g => basename(g.getAttribute('target') || ''))
          .filter(Boolean)
        const loadedNames = pages.map(p => basename(p.filePath || p.uri || p.imageName || ''))
        const missingImages = meiTargets.filter(t => !loadedNames.includes(t))
        const unreferencedImages = loadedNames.filter(n => !meiTargets.includes(n))
        if (missingImages.length > 0 || unreferencedImages.length > 0) {
          commit('SET_LOADING', false)
          commit('SHOW_IMAGE_MISMATCH_MODAL', { missing: missingImages, unreferenced: unreferencedImages })
          return // Don't load anything if there's a mismatch
        }
      }
      
      commit('SET_XML_DOC', xmlDoc)
      commit('SET_PAGES', pages)
      commit('SET_CURRENT_PAGE', 0)
      commit('SET_LOADING', false)
      commit('HIDE_MODALS')  // Close the modal when images are loaded
    },
    setCurrentPage({ commit }, i) {
      commit('SET_CURRENT_PAGE', i)
    },
    setCurrentPageZone({ commit }, j) {
      commit('SET_TOTAL_ZONES_COUNT', j)
    },
    importIIIF({ commit, dispatch }, url) {
      commit('SET_LOADING', true);

      // Fetch the IIIF manifest, validate it, convert it to MEI and load it.
      // Handles both IIIF Presentation 2 (sequences/canvases) and Presentation 3
      // (items) manifests; conversion happens in iiifManifest2mei/addPage.
      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`the manifest could not be fetched (HTTP ${res.status}).`);
          }
          return res.json();
        })
        .then(json => {
          if (!checkIiifManifest(json)) {
            throw new Error('the provided URL does not point to a valid IIIF manifest.');
          }
          commit('SET_LOADING', false);
          commit('SET_PROCESSING', true);
          return iiifManifest2mei(json, url, parser);
        })
        .then(mei => {
          dispatch('setData', mei);
        })
        .catch(error => {
          // Surface a clear, human-readable reason for the failure.
          console.error('Error fetching IIIF manifest:', error);
          commit('SET_LOADING', false);
          window.alert('The IIIF manifest could not be loaded: ' + error.message);
        })
        .finally(() => {
          commit('SET_PROCESSING', false);
        });
    },
        
    importXML({ commit, dispatch }, mei) {
      fetch(mei)
        .then(res => {
          return res.text()
        })
        .then(xml => {
          const mei = parser.parseFromString(xml, 'application/xml')
          dispatch('setData', mei)
        })
    },
    async uploadLocalMei({ dispatch }, mei) {
      await dispatch('resolveLocalGithubImageUrls', mei)
      await dispatch('setData', mei)
    },
    async autoDetectZonesOnCurrentPage({ commit, state }) {
      const pageIndex = state.currentPage
      const imageUri = state.pages[pageIndex].uri.replace(/\/info\.json/, '') + '/full/full/0/default.jpg'
      const blob = await fetch(imageUri).then(r => r.blob())
      try {
        const pageIndex = state.currentPage;
        const imageUri = state.pages[pageIndex].uri.replace(/\/info\.json/, '') + '/full/full/0/default.jpg';
        const response = await fetch(imageUri);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        // Further processing with the blob
    } catch (error) {
        console.error('Error fetching image blob:', error);
        // Handle the error gracefully
    }
      const successFunc = (json) => {
        commit('SET_LOADING', false)
        // do some sorting here, if necessary
        // then call measure generation
        commit('CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE', { rects: json.measures, pageIndex })
      }

      const errorFunc = (err) => {
        commit('SET_LOADING', false)
      }
      const formdata = new FormData()
      formdata.append('Content-Type', 'image/jpg')
      formdata.append('filename', 'image.jpg')
      formdata.append('image', blob, 'image.jpg')

      const requestOptions = {
        method: 'POST',
        body: formdata
      }
      commit('SET_LOADING', true)
      fetch('https://measure-detector.edirom.de/upload', requestOptions)
        .then(response => response.json())
        .then(json => successFunc(json))
        .catch(error => errorFunc(error))
    },
    async autoDetectZonesOnAllPage({ commit, state }) {
      for (let i = 0; i < state.pages.length; i++) {
        const pageIndex = i + 1
        const imageUri = state.pages[pageIndex].uri + '/full/full/0/default.jpg'
        const blob = await fetch(imageUri).then(r => r.blob())

        const successFunc = (json) => {
          commit('SET_LOADING', false)
          // do some sorting here, if necessary
          // then call measure generation
          commit('CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE', { rects: json.measures, pageIndex })
        }

        const errorFunc = (err) => {
          commit('SET_LOADING', false)
        }
        const formdata = new FormData()
        formdata.append('Content-Type', 'image/jpg')
        formdata.append('filename', 'image.jpg')
        formdata.append('image', blob, 'image.jpg')

        const requestOptions = {
          method: 'POST',
          body: formdata
        }
        commit('SET_LOADING', true)
        fetch('https://measure-detector.edirom.de/upload', requestOptions)
          .then(response => response.json())
          .then(json => successFunc(json))
          .catch(error => errorFunc(error))
      }
    },
    async setData({ dispatch, commit }, mei) {
      await dispatch('revokeGithubBlobUrls')
      const pageArray = getPageArray(mei)
      
      commit('SET_PAGES', pageArray)
      commit('SET_XML_DOC', mei)
      commit('SET_CURRENT_PAGE', 0)
      commit('SET_PROCESSING', false)
      commit('HIDE_MODALS')
      
      // Verify image references after loading MEI data
      dispatch('verifyImageReferences')
    },
    selectZone({ commit }, id) {
      commit('SELECT_ZONE', id)
    },
    clickZone({ commit, state }, id) {
      if (state.mode === allowedModes.deletion) {
        state.deleteZoneId = id
        commit('DELETE_ZONE', id)
      } else if (state.mode === allowedModes.additionalZone) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        toggleAdditionalZone(xmlDoc, id, state)
        state.xmlDoc = xmlDoc
      }
    },
    clickMeasureLabel({ commit }, id) {
      commit('SET_CURRENT_MEASURE_ID', id)
      commit('TOGGLE_MEASURE_MODAL')
    },
    closeMeasureNumberModal({ commit }) {
      commit('SET_CURRENT_MEASURE_ID', null)
      commit('TOGGLE_MEASURE_MODAL')
    },
    hoverZone({ commit }, id) {
      commit('HOVER_ZONE', id)
    },
    unhoverZone({ commit, state }, id) {
      // commit('SELECT_ZONE', id)
      if (state.hoveredZoneId === id) {
        commit('HOVER_ZONE', null)
      }
    },
    createZone({ commit }, annot) {
      commit('SET_ANNO', annot)
      commit('CREATE_ZONE_FROM_ANNOTORIOUS', annot)
    },
    deleteZone({ commit }, id) {
      commit('DELETE_ZONE', id)
    },
    updateZone({ commit }, annot) {
      commit('UPDATE_ZONE_FROM_ANNOTORIOUS', annot)
    },
    setMode({ commit }, mode) {
      commit('SET_MODE', mode)
    },
    toggleExistingMusicMode({ commit }) {
      commit('TOGGLE_EXISTING_MUSIC_MODE')
    },
    setCurrentMeasureLabel({ commit }, val) {
      commit('SET_CURRENT_MEASURE_LABEL', val)
    },
    setCurrentMeasureMultiRest({ commit }, val) {
      commit('SET_CURRENT_MEASURE_MULTI_REST', val)
    },
    setPageLabel({ commit }, { index, val }) {
      commit('SET_PAGE_LABEL', { index, val })
    },
    setCurrentMdiv({ commit }, id) {
      commit('SET_CURRENT_MDIV', id)
    },
    setCurrentMdivLabel({ commit }, val) {
      commit('SET_CURRENT_MDIV_LABEL', val)
    },
    createNewMdiv({ commit }) {
      commit('CREATE_NEW_MDIV')
    },
    selectMdiv({ commit }, selectedMdiv ) {
     commit('SELECT_MDIV', selectedMdiv);
    },
    registerImageImports({ commit }, urls) {
      const arr = urls.replace(/\s+/g, ' ').trim().split(' ')
      arr.forEach((url, index) => {
        commit('REGISTER_IMAGE_IMPORT', { url, index })
        fetch(url)
          .then(res => res.json())
          .then(json => {
            commit('RECEIVE_IMAGE_IMPORT', { url, index, json })
          })
          .catch(err => {
            commit('FAILED_IMAGE_IMPORT', { url, index })
          })
      })
    },
    acceptImageImports({ commit }) {
      commit('ACCEPT_IMAGE_IMPORTS')
    },
    cancelImageImports({ commit }) {
      commit('CANCEL_IMAGE_IMPORTS')
    },
    async loadFileFromGithub ({ commit, dispatch, getters }) {
      const file = getters['auth/selectedFile']
      const repo = getters['auth/selectedRepo']
      if (!file || !repo) throw new Error('No file selected')
      commit('SET_LOADING', true)
      try {
        const { xml, sha } = await dispatch('auth/getFileContent', { repo, path: file.path })
        const mei = parser.parseFromString(xml, 'application/xml')

        // If this MEI was generated from a GitHub image import, its <graphic target>
        // values are raw.githubusercontent.com URLs. For private repos those require
        // auth, so we re-fetch each image through the GitHub API and swap the target
        // to a local blob URL so OSD can display them. We keep a urlMap so that
        // committing later writes the real raw URLs back into the file.
        const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i
        const rawBase = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/`
        const urlMap = {}
        const imageGraphics = [...mei.querySelectorAll('graphic[target]')].filter(g => {
          const t = g.getAttribute('target')
          return t && t.startsWith(rawBase) && IMAGE_RE.test(t)
        })
        if (imageGraphics.length > 0) {
          await Promise.all(imageGraphics.map(async graphic => {
            const rawUrl = graphic.getAttribute('target')
            // Strip "owner/repo/REF/" prefix to get the file path
            const afterRepo = decodeURIComponent(rawUrl.slice(rawBase.length))
            const path = afterRepo.replace(/^[^/]+\//, '')
            try {
              const { bytes, name } = await dispatch('auth/getImageContent', { repo, path })
              const ext = name.split('.').pop().toLowerCase()
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                : ext === 'png' ? 'image/png'
                : ext === 'gif' ? 'image/gif'
                : ext === 'webp' ? 'image/webp'
                : 'application/octet-stream'
              const blob = new Blob([bytes], { type: mime })
              const blobUrl = URL.createObjectURL(blob)
              graphic.setAttribute('target', blobUrl)
              urlMap[blobUrl] = rawUrl
            } catch (e) {
              console.warn(`Could not fetch GitHub image ${rawUrl}:`, e)
            }
          }))
        }

        await dispatch('setData', mei)
        const hasUrlMap = Object.keys(urlMap).length > 0
        const selectedBranch = getters['auth/selectedBranch']
        commit('SET_GITHUB_FILE', {
          owner: repo.owner,
          repo: repo.name,
          path: file.path,
          sha,
          ...(hasUrlMap ? { urlMap } : {}),
          ...(selectedBranch ? { branch: selectedBranch.name } : {}),
        })
        commit('TOGGLE_LOADGIT_MODAL')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async loadImagesFromGithub ({ commit, dispatch, getters }) {
      const repo = getters['auth/selectedRepo']
      if (!repo) throw new Error('No repository selected')
      const contents = getters['auth/repoContents']
      const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i
      const imageItems = contents
        .filter(item => item.type === 'file' && IMAGE_RE.test(item.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      if (imageItems.length === 0) {
        throw new Error('No image files found in this folder. Navigate to a folder containing images.')
      }
      commit('SET_LOADING', true)
      const _activeBranch = getters['auth/selectedBranch']
      const _branchRef = _activeBranch ? _activeBranch.name : 'HEAD'
      try {
        const pages = await Promise.all(
          imageItems.map(async (item, index) => {
            const { bytes, name } = await dispatch('auth/getImageContent', { repo, path: item.path })
            const ext = name.split('.').pop().toLowerCase()
            const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
              : ext === 'png' ? 'image/png'
              : ext === 'gif' ? 'image/gif'
              : ext === 'webp' ? 'image/webp'
              : 'application/octet-stream'
            const blob = new Blob([bytes], { type: mime })
            const url = URL.createObjectURL(blob)
            // Canonical GitHub raw URL — used as the MEI <graphic target> at commit time
            const encodedPath = item.path.split('/').map(encodeURIComponent).join('/')
            const target = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${_branchRef}/${encodedPath}`
            let width = null
            let height = null
            try {
              const bitmap = await createImageBitmap(blob)
              width = bitmap.width
              height = bitmap.height
              bitmap.close()
            } catch (_) {}
            return { index, name: item.name, url, target, width, height }
          })
        )
        // Guarantee the surfaces are appended in the original sorted order,
        // regardless of which fetch resolved first.
        pages.sort((a, b) => a.index - b.index)
        const templateXml = await fetch('./assets/meiFileTemplate.xml').then(r => r.text())
        const xmlDoc = parser.parseFromString(templateXml, 'application/xml')
        const root = xmlDoc.querySelector('mei')
        root.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', 'm' + uuid())
        const source = xmlDoc.querySelector('source')
        if (source) source.parentNode.removeChild(source)
        const dateEl = xmlDoc.querySelector('change date')
        if (dateEl) dateEl.setAttribute('isodate', new Date().toISOString().substring(0, 10))
        pages.forEach(page => {
          addImportedPage(xmlDoc, page.index, page.url, page.width, page.height)
        })
        await dispatch('setData', xmlDoc)
        // Track the images folder so the generated MEI can be committed back.
        // urlMap maps each in-memory blob URL → canonical raw GitHub URL so that
        // the committed MEI file contains real paths, not temporary blob: URLs.
        const currentPath = getters['auth/currentRepoPath']
        const meiPath = currentPath ? `${currentPath}/cartographer.mei` : 'cartographer.mei'
        const urlMap = {}
        pages.forEach(page => { urlMap[page.url] = page.target })
        commit('SET_GITHUB_FILE', { owner: repo.owner, repo: repo.name, path: meiPath, sha: null, urlMap, ...(_activeBranch ? { branch: _activeBranch.name } : {}) })
        commit('TOGGLE_LOADGIT_MODAL')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    toggleCommitModal ({ commit }) {
      commit('TOGGLE_COMMIT_MODAL')
    },
    async commitToGithub ({ state, commit, dispatch }, { message, owner: ownerOverride, repo: repoOverride, path: pathOverride, branch: branchOverride, createNewBranch, baseBranch } = {}) {
      if (!state.githubFile || !state.xmlDoc) throw new Error('No GitHub file loaded')
      const { urlMap } = state.githubFile

      // Resolve target — overrides win over the stored githubFile values
      const owner  = ownerOverride  || state.githubFile.owner
      const repo   = repoOverride   || state.githubFile.repo
      const path   = pathOverride   || state.githubFile.path
      const branch = branchOverride !== undefined ? (branchOverride || undefined) : state.githubFile.branch

      // Create a new branch before committing if requested.
      // Only pass baseBranch when staying in the same repo — for a different repo
      // we deliberately omit it so createBranch uses the target's own default branch.
      if (createNewBranch && branch) {
        const sameRepo = owner === state.githubFile.owner && repo === state.githubFile.repo
        const base = sameRepo ? (state.githubFile.branch || null) : null
        await dispatch('auth/createBranch', {
          repo: { owner, name: repo },
          newBranch: branch,
          ...(base ? { baseBranch: base } : {}),
        })
      }

      // If the target changed from what was loaded, the stored sha is stale
      const targetChanged = createNewBranch ||
        owner  !== state.githubFile.owner ||
        repo   !== state.githubFile.repo ||
        path   !== state.githubFile.path ||
        branch !== state.githubFile.branch
      let sha = targetChanged ? null : state.githubFile.sha

      // Serialize the live MEI document
      let content = serializer.serializeToString(state.xmlDoc)

      // If this was an image-based import, swap in-memory blob: URLs → real GitHub raw URLs
      if (urlMap) {
        for (const [blobUrl, rawUrl] of Object.entries(urlMap)) {
          content = content.split(blobUrl).join(rawUrl)
        }
      }

      // Fetch the current sha for the target path/branch so we can update rather than
      // fail with 422 (needed when sha is null or the target has changed).
      if (!sha) {
        try {
          const existing = await dispatch('auth/getFileContent', {
            repo: { owner, name: repo },
            path,
            ref: branch || undefined,
          })
          sha = existing.sha
        } catch (e) {
          if (e.status !== 404) throw e
          // 404 → file does not exist yet → create new (sha stays null)
        }
      }

      try {
        const newSha = await dispatch('auth/commitFile', {
          repo: { owner, name: repo },
          path,
          sha,
          content,
          message: message || 'Update MEI file via Cartographer',
          ...(branch ? { branch } : {}),
        })
        if (newSha) commit('SET_GITHUB_FILE', { owner, repo, path, sha: newSha, urlMap, ...(branch ? { branch } : {}) })
      } catch (err) {
        if (err.status === 409) {
          const conflictErr = new Error('Conflict: the file was modified on GitHub after you loaded it.')
          conflictErr.isConflict = true
          throw conflictErr
        }
        throw err
      }
    },
    currentMdiv({ commit }, mdiv) {
      commit('CURRENT_MDIV', mdiv)
    },
    nextMdiv({ commit }, mdiv) {
      commit('NEXT_MDIV', mdiv)
    },
    previousMdiv({ commit }, mdiv) {        
      commit('PREVIOUS_MDIV', mdiv)
    },
    verifyImageReferences({ commit, state }) {
      if (!state.xmlDoc || !state.pages || state.pages.length === 0) {
        return
      }
      
      const basename = p => p.split('/').pop()
      const meiTargets = Array.from(state.xmlDoc.querySelectorAll('graphic'))
        .map(g => basename(g.getAttribute('target') || ''))
        .filter(Boolean)
      const loadedNames = state.pages.map(p => basename(p.uri || p.filePath || p.imageName || ''))
      const missingImages = meiTargets.filter(t => !loadedNames.includes(t))
      const unreferencedImages = loadedNames.filter(n => !meiTargets.includes(n))
      
      if (missingImages.length === 0 && unreferencedImages.length === 0) {
        return { hasMismatches: false }
      } else {
        commit('SHOW_IMAGE_MISMATCH_MODAL', { missing: missingImages, unreferenced: unreferencedImages })
        return { hasMismatches: true }
      }
    },
    closeImageMismatchModal({ commit }) {
      commit('HIDE_IMAGE_MISMATCH_MODAL')
    },
    cancelImageMismatch({ commit }) {
      commit('HIDE_IMAGE_MISMATCH_MODAL')
      commit('TOGGLE_LOADLOCALIMAGE_MODAL', false)
    }
  },
  /**
 * Vuex getters for accessing and computing derived state.
 * Getters provide convenient access to state properties and computed values for components.
 *
 * - isReady: Returns true if an MEI XML document is loaded.
 * - totalZones: Returns the total number of zones in the document.
 * - meiFileForDownload: Returns the serialized MEI XML as a string for download, or null if not loaded.
 * - currentPageIndexOneBased: Returns the current page index (1-based).
 * - currentPageIndexZeroBased: Returns the current page index (0-based).
 * - maxPageNumber: Returns the total number of pages.
 * - pages: Returns an array of page objects with tileSource, width, and coordinates for OpenSeadragon.
 * - pagesDetailed: Returns an array of page objects with tileSource, dimensions, page number, and label.
 * - currentPageObject: Returns the page object for the currently selected page.
 * - zonesOnCurrentPage: Returns an array of annotation objects for all zones on the current page except the selected one.
 * - measures: Returns an array of all <measure> elements in the MEI document.
 * - mdivs: Returns an array of all mdivs with id, label, and index.
 * - measuresByMdivId: Returns an array of measure objects for a given mdiv id, including zones and multiRest info.
 * - currentMdiv: Returns the currently selected mdiv object (id, label, index), or null if not set.
 * - currentMeasure: Returns the currently selected measure object (id, n, label, multiRest, mdiv), or null if not set.
 * - mode: Returns the current editor mode.
 * - selectedZone: Returns the annotation object for the currently selected zone, or null if not set.
 * - showLoadIIIFModal: Returns true if the IIIF modal is visible.
 * - showLoadGitModal: Returns true if the GitHub modal is visible.
 * - githubFile: Returns the currently loaded GitHub file info, or null.
 * - showLoadXMLModal: Returns true if the XML modal is visible.
 * - showMeasureModal: Returns true if the measure modal is visible.
 * - showPagesModal: Returns true if the pages modal is visible.
 * - showPageImportModal: Returns true if the page import modal is visible.
 * - showMdivModal: Returns true if the mdiv modal is visible.
 * - showMeasureList: Returns true if the measure list panel is visible.
 * - importingImages: Returns the array of images being imported.
 * - readyForImageImport: Returns true if all images are successfully imported and ready to be added as pages.
 * - existingMusicMode: Returns true if working with existing music content.
 * - firstMeasureWithoutZone: Returns the xml:id of the first measure without a zone, or null if all have zones.
 */
  getters: {
    isReady: state => {
      return state.xmlDoc !== null
    },
    totalZones: state => {
      return state.totalZones
    },
    meiFileForDownload: state => {
      if (state.xmlDoc === null) {
        return null
      }
      let content = serializer.serializeToString(state.xmlDoc)
      const rewriteMap = {
        ...(state.githubFile && state.githubFile.urlMap ? state.githubFile.urlMap : {}),
        ...(state.importedGithubUrlMap || {}),
      }
      for (const [blobUrl, rawUrl] of Object.entries(rewriteMap)) {
        content = content.split(blobUrl).join(rawUrl)
      }
      return formatXml(content)
    },
    currentPageIndexOneBased: state => {
      return state.currentPage + 1
    },
    currentPageIndexZeroBased: state => {
      return state.currentPage
    },
    maxPageNumber: state => {
      return state.pages.length
    },
    pages: state => {
      const arr = []
      state.pages.forEach(page => {
        const uri = page.uri || ''
        // A direct image is only a local/GitHub blob URL or a raw.githubusercontent.com file.
        // IIIF Image API service @ids frequently end in an image extension (e.g. .jpg/.tif)
        // but are NOT directly loadable images — they must be passed to OpenSeadragon as a
        // string so it fetches their /info.json. Never classify by file extension alone.
        const host = uri.startsWith('blob:') ? '' : (() => { try { return new URL(uri).hostname } catch { return '' } })()
        const isDirectImage = uri.startsWith('blob:') || host === 'raw.githubusercontent.com'
        // Handle local images (imageUrl), direct/GitHub images (blob or image URL), and IIIF pages
        let tileSource
        if (page.isLocalImage && page.imageUrl) {
          tileSource = { type: 'image', url: page.imageUrl }
          if (page.width > 0) tileSource.width = page.width
          if (page.height > 0) tileSource.height = page.height
        } else if (isDirectImage || page.isPlainImage) {
          tileSource = { type: 'image', url: page.uri }
          if (page.width > 0) tileSource.width = page.width
          if (page.height > 0) tileSource.height = page.height
        } else {
          tileSource = page.uri
        }
        const obj = {
          tileSource,
          width: page.width || undefined,
          x: 0,
          y: 0
        }
        arr.push(obj)
      })
      return arr
    },
    pagesDetailed: state => {
      const arr = []
      state.pages.forEach(page => {
        const uri = page.uri || ''
        // See the `pages` getter: only blob/GitHub-raw URLs are direct images; IIIF service
        // @ids may end in an image extension yet still require /info.json handling.
        const host = uri.startsWith('blob:') ? '' : (() => { try { return new URL(uri).hostname } catch { return '' } })()
        const isDirectImage = uri.startsWith('blob:') || host === 'raw.githubusercontent.com'
        let tileSource
        if (page.isLocalImage && page.imageUrl) {
          tileSource = { type: 'image', url: page.imageUrl }
          if (page.width > 0) tileSource.width = page.width
          if (page.height > 0) tileSource.height = page.height
        } else if (isDirectImage || page.isPlainImage) {
          tileSource = { type: 'image', url: uri }
        } else {
          tileSource = page.uri
        }
        let label = page.label || ''
        if (state.xmlDoc && page.id) {
          const surface = state.xmlDoc.querySelector(`surface[xml\\:id="${page.id}"]`)
          if (surface && surface.hasAttribute('label')) {
            label = surface.getAttribute('label') || ''
          }
        }
        const obj = {
          tileSource,
          dim: page.width + 'x' + page.height,
          n: page.n,
          label
        }
        arr.push(obj)
      })

      return arr
    },
    currentPageObject: state => {
      return state.pages[state.currentPage]
    },
    zonesOnCurrentPage: state => {
      if (state.xmlDoc === null || state.currentPage === -1) {
        return []
      }
      const index = state.currentPage + 1
      const surface = state.xmlDoc.querySelector('surface:nth-child(' + index + ')')

      if (surface === null) {
        return []
      }

      const zones = surface.querySelectorAll('zone')
      const pageUri = state.pages[state.currentPage].uri

      const annots = []
      zones.forEach(zone => {
        if (zone.getAttribute('xml:id') !== state.selectedZoneId) {
          annots.push(meiZone2annotorious(state.xmlDoc, zone, pageUri))
        }
      })
      return annots
    },
    measures: state => {
      if (state.xmlDoc === null) {
        return []
      }
      const measures = [...state.xmlDoc.querySelectorAll('measure')]

      return measures
    },
    mdivs: state => {
      if (state.xmlDoc === null) {
        return []
      }
      const arr = []
      state.xmlDoc.querySelectorAll('mdiv').forEach((mdiv, index) => {
        arr.push({
          id: mdiv.getAttribute('xml:id'),
          label: mdiv.getAttribute('label'),
          index
        })
      })
      return arr
    },
    measuresByMdivId: state => (id) => {
      if (state.xmlDoc === null) {
        return []
      }
      const arr = []
      const mdiv = [...state.xmlDoc.querySelectorAll('mdiv')].find(mdiv => mdiv.getAttribute('xml:id') === id)
      mdiv.querySelectorAll('measure').forEach((measure, index) => {
        let zones = []
        if (measure.hasAttribute('facs')) {
          zones = measure.getAttribute('facs').replace(/\s+/g, ' ').trim().split(' ')
        }
        const mrElem = measure.querySelector('multiRest')
        const multiRest = (mrElem === null) ? null : parseInt(mrElem.getAttribute('num'))
        arr.push({
          id: measure.getAttribute('xml:id'),
          n: measure.getAttribute('n'),
          label: measure.getAttribute('label'),
          multiRest,
          zones,
          index
        })
      })
      return arr
    },
    currentMdiv: state => {
      if (state.currentMdivId === null || state.xmlDoc === null) {
        return null
      }

      const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')]
      const index = mdivs.findIndex(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)

      if (index === -1) {
        return null
      }

      const mdiv = mdivs[index]

      return {
        id: mdiv.getAttribute('xml:id'),
        label: mdiv.getAttribute('label'),
        index: index
      }
    },
    currentMeasure: state => {
      if (state.currentMeasureId === null || state.xmlDoc === null) {
        return null
      }
      // const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')]
      // const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)
      let measures = [...state.xmlDoc.querySelectorAll('measure')]

      let measure = measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId)

      if(!measure){
        measure = state.currentMeasure
      }
      const mdiv = measure.closest('mdiv').getAttribute('xml:id')
      const multiRestElem = measure.querySelector('multiRest')
      const multiRest = (multiRestElem !== null) ? multiRestElem.getAttribute('num') : null


      const label = measure.hasAttribute('label') ? measure.getAttribute('label') : null

      const n = measure.getAttribute('n')
      const id = measure.getAttribute('xml:id')

      return {
        id,
        n,
        label,
        multiRest,
        mdiv
      }
    },
    mode: state => {
      return state.mode
    },
    selectedZone: state => {
      if (state.selectedZoneId === null || state.xmlDoc === null) {
        return null
      }
      const index = state.currentPage + 1
      const surface = state.xmlDoc.querySelector('surface:nth-child(' + index + ')')
      const zones = surface.querySelectorAll('zone')

      const zone = [...zones].find(zone => zone.getAttribute('xml:id') === state.selectedZoneId)
      const pageUri = state.pages[state.currentPage].uri
      return meiZone2annotorious(state.xmlDoc, zone, pageUri)
    },
    showLoadIIIFModal: state => state.showLoadIIIFModal,
    showLoadGitModal: state => state.showLoadGitModal,
    showCommitModal: state => state.showCommitModal,
    githubFile: state => state.githubFile,
    showLoadXMLModal: state => state.showLoadXMLModal,
    showLoadLocalImage: state => state.showLoadLocalImage,
    showMeasureModal: state => state.showMeasureModal,
    showPagesModal: state => state.showPagesModal,
    showPageImportModal: state => state.showPageImportModal,
    showImageMismatchModal: state => state.showImageMismatchModal,
    showMdivModal: state => state.showMdivModal,
    showAboutModal: state => state.showAboutModal,
    showMeasureList: state => state.showMeasureList,
    loading: state => state.loading,
    importingImages: state => state.importingImages,
    readyForImageImport: state => {
      let bool = true
      if (state.importingImages.length === 0) {
        return false
      }
      state.importingImages.every(img => {
        if (img.status !== 'success') {
          bool = false
          return false
        }
        return true
      })
      return bool
    },
    existingMusicMode: state => {
      return state.existingMusicMode
    },
    firstMeasureWithoutZone: state => {
      if (state.xmlDoc === null) {
        return null
      }
      const measure = state.xmlDoc.querySelector('music measure:not([facs])')
      if (measure === null) {
        return null
      }
      return measure.getAttribute('xml:id')
    },
    canUndo: state => {
      return state.historyIndex > 0
    },
    canRedo: state => {
      return state.historyIndex < state.history.length - 1
    },
  }
})