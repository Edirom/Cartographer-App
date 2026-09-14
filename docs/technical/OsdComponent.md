# OsdComponent Component

Displays the OpenSeadragon image viewer with annotation support for zones and measures.

---

## Overview

The `OsdComponent` component:
- Renders an OpenSeadragon viewer for high-resolution images.
- Integrates Annotorious for drawing and managing annotation zones.
- Renders overlays for zones, colored by mdiv.
- Handles selection, creation, update, and hover of annotation zones.
- Reacts to Vuex store changes for pages, zones, mode, and selection.

---

## Layout

- **Viewer**: Main image viewer (`#osdContainer`), full width or reduced if measure list is visible.
- **Overlays**: Annotation zones rendered as overlays with labels.

---

## Props

_None_

---

## Data

| Name        | Type    | Description                                  |
|-------------|---------|----------------------------------------------|
| colors      | Array   | List of RGBA colors for mdiv overlays        |
| colorIndex  | Number  | Current color index for assigning colors     |
| mdivColors  | Object  | Mapping of mdiv indices to assigned colors   |

---

## Computed Properties

| Name               | Description                                         |
|--------------------|-----------------------------------------------------|
| imageArray         | Returns the array of images from the store          |
| mode               | Returns the current annotation mode from the store  |
| measureListVisible | Whether the measure list pane is visible            |

---

## Methods

| Name            | Description                                                      |
|-----------------|------------------------------------------------------------------|
| getNextColor    | Returns the next color for mdiv overlays                        |
| renderZones     | Renders annotation overlays for all zones on the current page    |
| isDrawingMode   | Returns whether the given (or current) mode is a drawing mode (`manualRect` or `additionalZone`) |
| toggleSelection | Enables/disables drawing based on mode: sets Annotorious read-only state, toggles the active drawing layer, OpenSeadragon gesture navigation, and Annotorious drawing tracker |

---

## Lifecycle Hooks

- **mounted**: Initializes OpenSeadragon and Annotorious, sets up event listeners, and Vuex watchers.
- **beforeUnmount**: Cleans up Vuex watchers.

---

## Example

```vue
<OsdComponent />