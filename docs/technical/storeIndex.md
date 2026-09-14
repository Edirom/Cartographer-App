# Vuex Store (`src/store/index.js`)

Centralized state management for the **Cartographer App**.
This store wires together MEI editing, IIIF ingestion, local image import, GitHub loading, page/zone management, undo/redo history, and UI state.

---

## Overview

- **Framework:** Vuex (`createStore`)
- **External helpers:**
  - From `@/tools/iiif.js`: `iiifManifest2mei`, `checkIiifManifest`, `getPageArray`
  - From `@/tools/meiMappings.js`:
    `meiZone2annotorious`, `annotorious2meiZone`, `measureDetector2meiZone`,
    `generateMeasure`, `insertMeasure`, `deleteZone`, `setMultiRest`,
    `createNewMdiv`, `moveContentToMdiv`, `toggleAdditionalZone`,
    `addImportedPage`, `findZoneInsertionPositionForXmlZone`, `createAdditionalZone`
  - From `@/store/constants.js`: `mode as allowedModes`
- **Parsers:** `DOMParser` (XML → DOM), `XMLSerializer` (DOM → string)
- **Constants:** `MAX_HISTORY = 50` — maximum number of undo states kept in memory

---

## Module-Level Helpers

### `formatXml(xmlString)`

Formats a serialized XML string with proper two-space indentation.
Used by the `meiFileForDownload` getter so the downloaded MEI file is human-readable.

| Param | Type | Description |
|---|---|---|
| `xmlString` | `string` | Raw XML string from the serializer |

**Returns:** `string` — formatted XML with indentation.

### `saveToHistory(state)`

Saves the current `xmlDoc` to the undo history. Debounced (50 ms) so that
multiple mutations occurring together produce a single history entry. If the
history pointer is not at the end (i.e. after an undo), all "future" states are
discarded before pushing. History is capped at `MAX_HISTORY` (50) entries.

Every mutation that modifies the MEI document calls this helper **before**
cloning and changing `xmlDoc`.

### `getDefaultState()`

Returns a fresh copy of the default state object. Used on store creation and by
`RESET_STATE`.

---

## State

| Key | Type | Description |
|---|---|---|
| `selectedRepo` | `Object \| null` | Currently selected GitHub repository |
| `selectedDirectory` | `Object \| null` | Currently selected directory within the repo |
| `directories` | `Array` | List of directories in the selected repo |
| `repos` | `Array \| null` | List of available repositories |
| `xmlDoc` | `Document \| null` | The loaded MEI XML document (DOM) |
| `currentMdiv` | `Element \| null` | The current mdiv containing the current measure |
| `nextMdiv` / `previousMdiv` | `Element \| null` | Neighbouring mdivs (if applicable) |
| `pages` | `Array` | Array of page objects (from MEI, IIIF, or local images) |
| `currentPage` | `number` | Index of the currently selected page (`-1` if none) |
| `history` | `Array<Document>` | Snapshots of `xmlDoc` for undo/redo |
| `historyIndex` | `number` | Current position in `history` |
| `showLoadXMLModal` | `boolean` | Show/hide the XML file load modal |
| `showLoadIIIFModal` | `boolean` | Show/hide the IIIF manifest load modal |
| `showLoadGitModal` | `boolean` | Show/hide the GitHub load modal |
| `showLoadLocalImage` | `boolean` | Show/hide the local image load modal |
| `showMeasureModal` | `boolean` | Show/hide the measure label/number modal |
| `showMdivModal` | `boolean` | Show/hide the movement (mdiv) modal |
| `showPagesModal` | `boolean` | Show/hide the page management modal |
| `showPageImportModal` | `boolean` | Show/hide the page/image import modal |
| `showMeasureList` | `boolean` | Show/hide the measure list panel |
| `showImageMismatchModal` | `boolean` | Show/hide the image mismatch warning modal |
| `loading` | `boolean` | App is currently loading data |
| `processing` | `boolean` | App is currently processing data |
| `logedin` | `boolean` | User is logged in |
| `pageDimension` | `Array<[number, number]>` | `[width, height]` for each page |
| `mode` | `string` | Current editor mode (`selection`, `manualRect`, `additionalZone`, `deletion`, …) |
| `existingMusicMode` | `boolean` | True if working with existing music content |
| `selectedZoneId` / `hoveredZoneId` | `string \| null` | `xml:id` of the selected / hovered zone |
| `currentMdivId` | `string \| null` | `xml:id` of the currently selected mdiv |
| `currentMeasureId` | `string \| null` | `xml:id` of the currently selected measure |
| `currentMeasure` | `Element \| null` | The current measure object |
| `totalZones` | `number` | Total number of zones in the document |
| `deleteZoneId` | `string \| null` | `xml:id` of the zone to be deleted |
| `anno` | `Object \| null` | Current annotation object (Annotorious) |
| `canvases` | `Array` | IIIF canvases (if loaded) |
| `infoJson` | `Array<string>` | IIIF `info.json` URLs for canvases |
| `importingImages` | `Array` | Images being imported, each with a status |
| `newFirstMeasure` | `string` | First measure of the old mdiv when creating a new mdiv |
| `oldMdiv` | `Element \| null` | The mdiv content is being moved from |
| `selectedMdiv` | `Element \| null` | The mdiv selected in the mdiv modal |
| `insertMdivup` | `boolean` | True if the new mdiv is inserted before the current one |
| `additionMeasure` | `boolean` | True while an additional measure is added (prevents recursion) |
| `localImagePages` | `Array` | References to local image pages (prevents blob URL garbage collection) |
| `missingImages` | `Array<string>` | Image paths referenced in MEI but not found |
| `unreferencedImages` | `Array<string>` | Loaded images not referenced in MEI |
| `originalMeiGraphicCount` | `number` | Graphic count of the original MEI, for verification |
| `resultingArray` | `Array` | Generic array for storing results (usage varies) |

---

## Mutations

Mutations synchronously update the state. All mutations that modify the MEI
document follow the same pattern: call `saveToHistory(state)`, clone `xmlDoc`,
modify the clone, and commit the clone back to `state.xmlDoc`.

### State & History

| Mutation | Description |
|---|---|
| `RESET_STATE` | Resets the entire state to its default values |
| `UNDO` | Steps the history pointer back and restores that `xmlDoc` snapshot |
| `REDO` | Steps the history pointer forward and restores that snapshot |

### Modal & Panel Visibility

| Mutation | Description |
|---|---|
| `TOGGLE_LOADXML_MODAL` | Toggle the XML file load modal |
| `TOGGLE_LOADIIIF_MODAL` | Toggle the IIIF manifest load modal |
| `TOGGLE_LOADGIT_MODAL` | Toggle the GitHub load modal |
| `TOGGLE_LOADLOCALIMAGE_MODAL` | Toggle the local image modal; accepts an optional explicit boolean |
| `TOGGLE_MEASURE_MODAL` | Toggle the measure label/number modal |
| `TOGGLE_PAGES_MODAL` | Toggle the page management modal |
| `TOGGLE_PAGE_IMPORT_MODAL` | Toggle the page/image import modal |
| `TOGGLE_MDIV_MODAL` | Toggle the movement (mdiv) modal |
| `TOGGLE_MEASURE_LIST` | Toggle the measure list panel |
| `HIDE_MODALS` | Hide the measure, mdiv, and local-image modals |
| `TOGGLE_IMAGE_MISMATCH_MODAL` | Toggle the image mismatch modal |
| `SHOW_IMAGE_MISMATCH_MODAL` | Set the mismatch lists (`missing`, `unreferenced`) and show the modal |
| `HIDE_IMAGE_MISMATCH_MODAL` | Hide the mismatch modal and clear both lists |
| `SET_IMAGE_MISMATCHES` | Set the `missingImages` / `unreferencedImages` lists |

### Document & Pages

| Mutation | Description |
|---|---|
| `SET_XML_DOC` | Set the loaded MEI document, reset `currentPage` to 0, and initialize the history with this document |
| `SET_PAGES` | Set the array of page objects |
| `SET_LOCAL_IMAGE_PAGES` | Store local image page references (keeps blob URLs alive) |
| `SET_CURRENT_PAGE` | Set the current page index (bounds-checked) |
| `SET_PAGE_LABEL` | Set the `label` attribute of a specific surface |
| `SET_TOTAL_ZONES_COUNT` | Increment the total zone count by a given value |
| `SET_LOADING` / `SET_PROCESSING` | Set the loading / processing flags |

### Zones

| Mutation | Description |
|---|---|
| `SELECT_ZONE` / `HOVER_ZONE` | Set the selected / hovered zone id |
| `CREATE_ZONE_FROM_ANNOTORIOUS` | Create a zone from an Annotorious annotation. In standard mode a new measure is created for the zone; in existing-music mode the zone is attached to the first measure without `@facs`; in additional-zone mode the zone is inserted into the appropriate measure |
| `CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE` | Create zones from detected rectangles (`{ rects, pageIndex }`) and generate/attach measures accordingly |
| `UPDATE_ZONE_FROM_ANNOTORIOUS` | Update an existing zone's coordinates (`ulx`, `uly`, `lrx`, `lry`) from an annotation |
| `DELETE_ZONE` | Delete a zone by `xml:id` |
| `TOGGLE_ADDITIONAL_ZONE` | Toggle a zone's "additional zone" status |

### Editor Mode & Measures

| Mutation | Description |
|---|---|
| `SET_MODE` | Set the current editor mode (validated against `allowedModes`) |
| `TOGGLE_EXISTING_MUSIC_MODE` | Toggle existing-music mode |
| `SET_CURRENT_MEASURE_ID` | Resolve and set the current measure id (accepts a measure id or a zone id via `@facs`) |
| `SET_CURRENT_MEASURE_LABEL` | Set or remove the `label` attribute of the current measure |
| `SET_CURRENT_MEASURE_MULTI_REST` | Set, update, or remove a `multiRest` element in the current measure |

### Movements (mdivs)

| Mutation | Description |
|---|---|
| `SET_CURRENT_MDIV` | Set the current mdiv id |
| `SET_CURRENT_MDIV_LABEL` | Set the `label` attribute of the current mdiv |
| `CREATE_NEW_MDIV` | Create a new mdiv and move content (from the current measure onward) into it |
| `SELECT_MDIV` | Move content to a selected mdiv and update the current mdiv id |
| `CURRENT_MDIV` / `NEXT_MDIV` / `PREVIOUS_MDIV` | Set the current / next / previous mdiv objects |

### Image Import

| Mutation | Description |
|---|---|
| `REGISTER_IMAGE_IMPORT` | Register an image being imported (status `loading`) |
| `RECEIVE_IMAGE_IMPORT` | Mark an import as `success` and store its dimensions |
| `FAILED_IMAGE_IMPORT` | Mark an import as `failed` |
| `ACCEPT_IMAGE_IMPORTS` | Add all successfully imported images as pages to the MEI document and rebuild the page array |
| `CANCEL_IMAGE_IMPORTS` | Discard pending imports and hide the import modal |

### GitHub

| Mutation | Description |
|---|---|
| `SET_SELECTED_DIRECTORY` | Set the currently selected directory in the repository |
| `SET_ANNO` | Set the current annotation object |

---

## Actions

Actions perform asynchronous work and coordinate mutations.

### Loading & Import

| Action | Description |
|---|---|
| `importXML(mei)` | Fetches an MEI file, parses it, and dispatches `setData` |
| `importIIIF(url)` | Fetches a IIIF manifest, validates it, fetches all `info.json` files **concurrently** (`Promise.allSettled`), stores page dimensions, converts the manifest to MEI via `iiifManifest2mei`, and dispatches `setData` |
| `addLocalImagePages(input)` | Builds a complete MEI document for locally imported images. Loads the standard MEI template (with an inline fallback), creates `surface`/`graphic` elements with UUID-based ids for each image, merges zones and body content from an original MEI if one was provided, and verifies that image filenames match the MEI `graphic/@target` values (by basename). On mismatch, shows the **Image Mismatch Modal** instead of loading |
| `setData(mei)` | Sets the MEI document and pages, resets the current page, hides modals, and dispatches `verifyImageReferences` |
| `verifyImageReferences()` | Compares MEI `graphic/@target` basenames against loaded page names; shows the mismatch modal when `missing` or `unreferenced` images are found |
| `registerImageImports(urls)` | Splits a whitespace-separated URL list, registers each image, and fetches its `info.json` (committing success/failure per image) |
| `acceptImageImports()` / `cancelImageImports()` | Commit or discard the pending image imports |

### Automatic Measure Detection

| Action | Description |
|---|---|
| `autoDetectZonesOnCurrentPage()` | Fetches the current page image as a blob and POSTs it to the Measure Detector service (`https://measure-detector.edirom.de/upload`); on success commits `CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE` |
| `autoDetectZonesOnAllPage()` | Runs the same detection for every page |

### Zones & Measures

| Action | Description |
|---|---|
| `selectZone(id)` / `hoverZone(id)` / `unhoverZone(id)` | Selection and hover handling |
| `clickZone(id)` | In deletion mode deletes the zone; in additional-zone mode toggles the additional-zone status |
| `createZone(annot)` / `updateZone(annot)` / `deleteZone(id)` | Zone lifecycle from Annotorious annotations |
| `clickMeasureLabel(id)` / `closeMeasureNumberModal()` | Open / close the measure modal for a measure |
| `setCurrentMeasureLabel(val)` / `setCurrentMeasureMultiRest(val)` | Edit the current measure |
| `setMode(mode)` / `toggleExistingMusicMode()` | Editor mode handling |

### Movements (mdivs)

| Action | Description |
|---|---|
| `createNewMdiv()` | Create a new mdiv and move content to it |
| `selectMdiv(selectedMdiv)` | Move content to the selected mdiv |
| `setCurrentMdiv(id)` / `setCurrentMdivLabel(val)` | Current mdiv handling |
| `currentMdiv(mdiv)` / `nextMdiv(mdiv)` / `previousMdiv(mdiv)` | Set mdiv navigation objects |

### UI & Misc

| Action | Description |
|---|---|
| `resetAll()` | Reset the entire application state |
| `undo()` / `redo()` | Step through the document history |
| `toggleLoadXMLModal()`, `toggleLoadIIIFModal()`, `toggleLoadLocalImage()`, `toggleMeasureModal()`, `togglePagesModal()`, `togglePageImportModal()`, `toggleMdivModal()`, `toggleMeasureList()` | Modal / panel visibility |
| `closeImageMismatchModal()` / `cancelImageMismatch()` | Close the mismatch modal (the latter also closes the local-image modal) |
| `setCurrentPage(i)` / `setCurrentPageZone(j)` | Page index / zone count |
| `setPageLabel({ index, val })` | Page label editing |
| `setDirectory(directory)` | Set the selected repository directory |
| `fetchDirectories()` | Fetch directory listings from a GitHub repository *(stub — not fully implemented)* |

---

## Getters

| Getter | Returns |
|---|---|
| `isReady` | `true` if an MEI document is loaded |
| `totalZones` | Total number of zones in the document |
| `meiFileForDownload` | The serialized, **indented** MEI XML string for download (via `formatXml`), or `null` |
| `currentPageIndexOneBased` / `currentPageIndexZeroBased` | Current page index (1-based / 0-based) |
| `maxPageNumber` | Total number of pages |
| `pages` | Page objects with `tileSource` for OpenSeadragon. Local images use `{ type: 'image', url }` tile sources (width/height only included when known); IIIF pages use the `info.json` URI |
| `pagesDetailed` | Page objects with tile source, dimensions (`dim`), page number (`n`), and label |
| `currentPageObject` | The page object for the current page |
| `zonesOnCurrentPage` | Annotorious annotation objects for all zones on the current page **except** the selected one |
| `measures` | All `<measure>` elements in the document |
| `mdivs` | All mdivs as `{ id, label, index }` |
| `measuresByMdivId(id)` | Measures of a given mdiv, each with `{ id, n, label, multiRest, zones, index }` |
| `currentMdiv` | The current mdiv as `{ id, label, index }`, or `null` |
| `currentMeasure` | The current measure as `{ id, n, label, multiRest, mdiv }`, or `null` |
| `mode` | The current editor mode |
| `selectedZone` | The Annotorious annotation for the selected zone, or `null` |
| `showLoadIIIFModal`, `showLoadGitModal`, `showLoadXMLModal`, `showLoadLocalImage`, `showMeasureModal`, `showPagesModal`, `showPageImportModal`, `showImageMismatchModal`, `showMdivModal`, `showMeasureList` | Modal / panel visibility flags |
| `loading` | Loading flag |
| `importingImages` | The array of images currently being imported |
| `readyForImageImport` | `true` when at least one image is registered and **all** registered images imported successfully |
| `existingMusicMode` | Existing-music mode flag |
| `firstMeasureWithoutZone` | `xml:id` of the first measure without a zone, or `null` |
| `canUndo` / `canRedo` | Whether an undo / redo step is available |

---

## Undo/Redo Behaviour

- Every document-modifying mutation calls `saveToHistory` **before** applying its change, so the history stores the *pre-change* snapshots plus the state committed via `SET_XML_DOC`.
- Saves are debounced by 50 ms: several mutations fired together (e.g. a detector run creating many zones) produce a single undo step.
- After an undo, committing a new change discards the redo branch.
- At most **50** states are retained; older ones are dropped.