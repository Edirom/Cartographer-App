# Local Image Tools (`src/tools/localImages.js`)

Helper functions for importing **local image files** and turning them into
OpenSeadragon-compatible page objects. Handles common raster formats directly via
`createImageBitmap`, and falls back to a custom TIFF decoder (built on
[`utif`](https://www.npmjs.com/package/utif)) for TIFF containers — including
TIFFs whose pixel data is stored as an embedded JPEG.

---

## Overview

- Converts an array of image `File` objects into page objects consumed by the
  viewer and the Vuex store.
- For most formats, dimensions are read from a decoded `ImageBitmap` and the page
  points at an `URL.createObjectURL(file)` blob URL.
- For TIFFs, `UTIF` is used only to read metadata; the largest IFD is selected
  (to avoid thumbnails) and:
  - **JPEG-in-TIFF** (compression `6`/`7`): the embedded JPEG strip bytes are
    extracted and, when a `JPEGTables` (`t347`) tag is present, the missing
    `DQT`/`DHT` marker tables are injected so the browser's native decoder can
    read a self-contained JPEG stream. The result is re-encoded to PNG.
  - **Non-JPEG TIFF** (uncompressed, LZW, …): decoded to RGBA with UTIF's pixel
    decoder and re-encoded to PNG.
- Also provides utilities to sort, filter, and inspect the folder path of files.

---

## Exported Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `convertLocalImagesToPages(imageFiles)` | `imageFiles {File[]}` — array of image `File` objects | `Promise<Array>` — array of page objects | Decodes each file (with a TIFF/JPEG-in-TIFF fallback) and builds a page object with `type`, `url`/`imageUrl`/`uri`, `width`, `height`, `n`, `label`, `fileName`, `imageName`, `filePath`, `isLocalImage`, `hasSvg`, `hasZones`, and internal `_file`/`_blobUrl` references. |
| `sortImageFiles(files)` | `files {File[]}` — array of `File` objects | `File[]` — sorted array (mutated in place) | Sorts files by name using a natural, numeric-aware, case-insensitive comparison. |
| `filterImageFiles(files)` | `files {File[]}` — array of `File` objects | `File[]` — filtered array | Keeps only files whose name matches a supported image extension (`jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `bmp`, `tiff`). |
| `getFolderPath(file)` | `file {File}` — a `File` with `webkitRelativePath` | `string` — folder path | Returns the folder portion of the file's `webkitRelativePath` (empty string when unavailable). |

---

## Page Object Shape

Each object returned by `convertLocalImagesToPages` has the following properties:

| Property | Description |
|---|---|
| `type` | Always `'image'` |
| `url` / `imageUrl` | Blob URL of the decoded image (used as the OpenSeadragon tile source) |
| `uri` / `filePath` | Original path (`webkitRelativePath` or file name) |
| `width`, `height` | Image dimensions in pixels (`0` if decoding failed) |
| `n` | 1-based page number as a string |
| `label` | Generated `image<n><ext>` label |
| `fileName` | Original file name |
| `imageName` | Normalized name used inside the generated MEI |
| `isLocalImage` | Always `true` |
| `hasSvg`, `hasZones` | Always `false` for freshly imported images |
| `_file`, `_blobUrl` | Internal references kept to prevent blob URL garbage collection |

---

## Example Usage

```js
import {
  convertLocalImagesToPages,
  sortImageFiles,
  filterImageFiles,
  getFolderPath
} from '@/tools/localImages.js'

// From an <input type="file" webkitdirectory> change event:
const files = filterImageFiles([...event.target.files])
const sorted = sortImageFiles(files)
const pages = await convertLocalImagesToPages(sorted)

const folder = getFolderPath(sorted[0])
```
