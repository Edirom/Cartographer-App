# IIIF Tools (`src/tools/iiif.js`)

Helper functions for converting **IIIF manifests** into MEI XML documents, validating manifests, and extracting pages.

---

## `addPage(canvas, canvases, dimension, n, file, meiSurfaceTemplate, hasItems)`

Adds a page (`<surface>`) to the MEI file from a IIIF canvas.

**Parameters:**
- `canvas {Object}` — IIIF canvas object  
- `canvases {Array}` — Array of all canvases (for dimension lookup)  
- `dimension {Array}` — `[width, height]` for the image  
- `n {number}` — Page number (1-based)  
- `file {Document}` — The MEI XML document to modify  
- `meiSurfaceTemplate {Document}` — MEI surface template XML  
- `hasItems {boolean}` — `true` if IIIF Presentation 3 (items), `false` if Presentation 2 (images)  

**Behavior:**
- Extracts the label and dimensions of the canvas.  
- Determines the `info.json` URI based on IIIF version.  
- Generates unique IDs for `<surface>` and `<graphic>`.  
- Clones the surface template, sets attributes, and appends it to the MEI `<facsimile>`.  

---

## `iiifManifest2mei(json, url, parser, state)`

Converts a IIIF manifest JSON object into an MEI XML document.

**Parameters:**
- `json {Object}` — IIIF manifest JSON  
- `url {string}` — Manifest URL  
- `parser {DOMParser}` — XML parser instance  
- `state {Object}` — Application state (for page dimensions)  

**Behavior:**
- Loads MEI file and surface templates asynchronously.  
- Sets up MEI metadata (title, source, date, etc.) from the IIIF manifest.  
- Attempts to extract **shelfmark** and **composer** from IIIF metadata.  
- Iterates over canvases (Presentation 2) or items (Presentation 3) and adds each as a surface/page using `addPage`.  

**Returns:**  
- `Promise<Document>` — Resolves to the generated MEI XML document.  

---

## `checkIiifManifest(json)`

Checks if a given JSON object is a valid IIIF manifest (Presentation 2 or 3).

**Parameters:**
- `json {Object}` — IIIF manifest JSON  

**Returns:**  
- `{boolean}` — `true` if the manifest is valid, otherwise `false`.  

**Validation logic:**
- Verifies IIIF context (`@context`)  
- Checks manifest type (`sc:Manifest`)  
- Ensures an ID (`@id`) is present  
- Confirms presence of `sequences` (IIIF v2) or `items` (IIIF v3)  

---

## `getPageArray(mei)`

Extracts an array of page objects from an MEI XML document.

**Parameters:**
- `mei {Document}` — MEI XML document  

**Returns:**  
- `{Array}` — Array of page objects with:  
  - `uri` — Image target URI (from `graphic/@target`)  
  - `id` — MEI surface ID  
  - `n` — Page number  
  - `label` — Surface label  
  - `width`, `height` — Dimensions (from the graphic, falling back to the surface `lrx`/`lry` minus `ulx`/`uly`)  
  - `hasSvg` — Whether the surface has an embedded SVG  
  - `hasZones` — Whether the surface contains zones  

---

## Example Usage

```js
import { iiifManifest2mei, checkIiifManifest, getPageArray } from '@/tools/iiif.js'

// Validate a manifest
const isValid = checkIiifManifest(manifestJson)

// Convert IIIF manifest to MEI
const meiDoc = await iiifManifest2mei(manifestJson, manifestUrl, parser, state)

// Extract page data
const pages = getPageArray(meiDoc)
