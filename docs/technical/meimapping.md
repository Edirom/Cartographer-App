# MEI Mapping Tools (`src/tools/meiMappings.js`)

Helper functions to convert between MEI zones, Annotorious annotations, detected rectangles, and to manipulate measures/mdivs.  
This includes both **exported functions** (public API) and **internal helpers** (not exported but important for maintainers).

---


### `meiZone2annotorious(mei, zoneInput, pageUri)`
Converts an MEI `<zone>` into an Annotorious annotation object.  

```js
export function meiZone2annotorious (mei, zoneInput, pageUri) { ... }
```

**Parameters**  
- `mei {Document}` – MEI XML document  
- `zoneInput {Element|string}` – `<zone>` element or its xml:id  
- `pageUri {string}` – Page image URI  

**Returns**  
- `{Object}` – Annotorious-compatible annotation  

---

### `annotorious2meiZone(annot)`
Converts an Annotorious annotation into an MEI `<zone>`.

```js
export function annotorious2meiZone (annot) { ... }
```

**Parameters**  
- `annot {Object}` – Annotorious annotation  

**Returns**  
- `{Element}` – MEI `<zone>`  

---

### `measureDetector2meiZone(rect)`
Converts a detected rectangle into an MEI `<zone>`.

```js
export function measureDetector2meiZone (rect) { ... }
```

**Parameters**  
- `rect {Object}` – Rectangle `{ ulx, uly, lrx, lry }`  

**Returns**  
- `{Element}` – MEI `<zone>`  

---

### `generateMeasure()`
Creates a new MEI `<measure>`.

```js
export function generateMeasure () { ... }
```

**Returns**  
- `{Element}` – `<measure>` with unique xml:id  

---

### `updateMdiv(xmlDoc, nodeToMove, state, currentZone, pageIndex, targetMdiv)`
Moves a measure (and its surrounding block) from its current movement into another movement, renumbering measures and removing any resulting empty sections/mdivs. Returns a Promise.

```js
export function updateMdiv (xmlDoc, nodeToMove, state, currentZone, pageIndex, targetMdiv) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI document  
- `nodeToMove {Element}` – The measure to move  
- `state {Object}` – Vuex state (uses `selectedMdiv`, `currentMdiv`, `currentMeasure`)  
- `currentZone {Element|string}` – Zone associated with the move (unused placeholder in some calls)  
- `pageIndex {number}` – Page index (unused placeholder in some calls)  
- `targetMdiv {Element}` – Destination movement  

**Returns**  
- `{Promise<Element>}` – Resolves to the resulting current measure (or the moved node)  

---

### `insertMeasure(xmlDoc, measure, state, currentZone, pageIndex, targetMdiv, additionalZone)`
Inserts a `<measure>` into the MEI.

```js
export function insertMeasure (xmlDoc, measure, state, currentZone, pageIndex, targetMdiv, additionalZone) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI file  
- `measure {Element}` – New measure  
- `state {Object}` – Vuex state  
- `currentZone {Element}` – Zone for this measure  
- `pageIndex {number}` – Page index  
- `targetMdiv {Element}` – Target movement  
- `additionalZone {Element?}` – Optional additional zone  

---

### `getFollowingMeasuresByMeasure(measure)`
Get all measures following a given one.

```js
export function getFollowingMeasuresByMeasure (measure) { ... }
```

**Parameters**  
- `measure {Element}` – Current measure  

**Returns**  
- `{Array<Element>}` – List of following measures  

---

### `addZoneToLastMeasure(xmlDoc, zoneId)`
Adds a zone to the last `<measure>` in the MEI.

```js
export function addZoneToLastMeasure (xmlDoc, zoneId) { ... }
```

---

### `getPrecedingZoneNoMatterWhere(xmlDoc, zone)`
Returns the nearest preceding `<zone>` relative to a reference zone, searching earlier siblings and, if none are found, the last zone on a previous page.

```js
export function getPrecedingZoneNoMatterWhere (xmlDoc, zone) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI DOM  
- `zone {Element}` – Reference zone  

**Returns**  
- `{Element|null}` – Nearest preceding zone, or `null`  

---

### `createNewMdiv(xmlDoc, state, afterMdivId)`
Creates a new `<mdiv>` (movement).

```js
export function createNewMdiv (xmlDoc, state, afterMdivId) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI document  
- `state {Object}` – Vuex state  
- `afterMdivId {string?}` – Optional target to insert after  

**Returns**  
- `{string}` – New mdiv xml:id  

---

### `deleteZone(xmlDoc, id, state)`
Deletes a zone and updates measures accordingly.

```js
export function deleteZone (xmlDoc, id, state) { ... }
```

---

### `toggleAdditionalZone(xmlDoc, id, state)`
Toggle zone between new measure and merged measure.

```js
export function toggleAdditionalZone (xmlDoc, id, state) { ... }
```

---

### `setMultiRest(measure, val)`
Sets, updates, or removes a `<multiRest>`.

```js
export function setMultiRest (measure, val) { ... }
```

---

### `moveContentToMdiv(xmlDoc, firstMeasureId, targetMdivId, state)`
Moves a sequence of measures into a target mdiv.

```js
export function moveContentToMdiv (xmlDoc, firstMeasureId, targetMdivId, state) { ... }
```

---

### `addImportedPage(xmlDoc, index, url, width, height)`
Adds a new `<surface>` page.

```js
export function addImportedPage (xmlDoc, index, url, width, height) { ... }
```

---

### `getPreviousMeasure(currentMeasure, xmlDoc)`
Returns the closest preceding `<measure>` sibling of a given measure.

```js
export function getPreviousMeasure (currentMeasure, xmlDoc) { ... }
```

**Parameters**  
- `currentMeasure {Element}` – The reference measure  
- `xmlDoc {Document}` – MEI DOM  

**Returns**  
- `{Element|null}` – The preceding measure, or `null`  

---

### `addZoneToExisingMeasure(precedingMeasure, newZone)`
Adds a zone reference to a measure's `@facs` attribute if it is not already present.

```js
export function addZoneToExisingMeasure (precedingMeasure, newZone) { ... }
```

**Parameters**  
- `precedingMeasure {Element}` – The `<measure>` to update  
- `newZone {Element}` – The `<zone>` to reference  

**Returns**  
- `{boolean}` – `true` if the zone was added, `false` if already present or on invalid input  

---

## Internal Helpers

### `incrementMeasureNum(num, diff)`
```js
function incrementMeasureNum (num, diff) {
  return parseInt(num) + diff
}
```

**Parameters**  
- `num {string|number}` – Current measure number  
- `diff {number}` – Amount to add  

**Returns**  
- `{number}` – New measure number  

---

### `decrementMeasureNum(num, diff)`
```js
function decrementMeasureNum (num, diff) {
  return parseInt(num) - diff
}
```

**Parameters**  
- `num {string|number}` – Current measure number  
- `diff {number}` – Amount to subtract  

**Returns**  
- `{number}` – New measure number  

---

### `getLastMeasure(xmlDoc)`
```js
function getLastMeasure (xmlDoc) {
  const measure = [...xmlDoc.querySelectorAll('measure')].slice(-1)[0]
  return measure
}
```

**Parameters**  
- `xmlDoc {Document}` – MEI DOM  

**Returns**  
- `{Element|undefined}` – Last measure or undefined  

---

### `getPrecedingZone(xmlDoc, surface)`
```js
function getPrecedingZone (xmlDoc, surface) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI DOM  
- `surface {Element}` – Current page  

**Returns**  
- `{Element|null}` – Last zone on a previous page  

---

### `getMeasuresFromZone(xmlDoc, zone)`
```js
function getMeasuresFromZone (xmlDoc, zone) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI DOM  
- `zone {Element}` – Zone element  

**Returns**  
- `{Array<Element>}` – Measures referencing the zone  

---

### `getZonesFromMeasure(xmlDoc, measure)`
```js
function getZonesFromMeasure (xmlDoc, measure) { ... }
```

**Parameters**  
- `xmlDoc {Document}` – MEI DOM  
- `measure {Element}` – Measure element  

**Returns**  
- `{Array<Element>}` – Zones linked by @facs  

---

### `addMultRest(precedingMeasure)`
```js
function addMultRest (precedingMeasure) { ... }
```

**Parameters**  
- `precedingMeasure {Element}` – Measure to inspect  

**Returns**  
- `{number|null}` – The `<multiRest>` `num` value (when positive), otherwise `null`  

---

## Example Usage

```js
import {
  meiZone2annotorious,
  annotorious2meiZone,
  measureDetector2meiZone,
  generateMeasure,
  insertMeasure,
  addZoneToLastMeasure,
  createNewMdiv,
  deleteZone,
  toggleAdditionalZone,
  setMultiRest,
  moveContentToMdiv,
  addImportedPage,
  ...
} from '@/tools/meiMappings.js'

// Convert zone → annotation
const annot = meiZone2annotorious(meiDoc, 'zone123', pageUri)

// Convert annotation → zone
const zone = annotorious2meiZone(annot)

// Add zone to last measure
addZoneToLastMeasure(meiDoc, 'zone123')

// Create new movement
const mdivId = createNewMdiv(meiDoc, state)

// Delete a zone
deleteZone(meiDoc, 'zone456', state)
```
