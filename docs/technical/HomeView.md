# HomeView

The main application view. Acts as the root editor shell that assembles the header, footer, sidebar, OpenSeadragon viewer, content preview, and all modal dialogs, and wires up global keyboard shortcuts.

---

## Overview

`HomeView` is the component rendered for the `/` route. It provides:
- The primary layout (`AppHeader`, `OsdComponent`, `ContentPreviewPane`, `AppSidebar`, `AppFooter`)
- Conditional rendering of every modal dialog based on Vuex visibility getters
- A global loading overlay
- Global keyboard shortcuts for switching editor modes and toggling panels

> Note: the component's internal `name` option is `'App'`, but the file is `src/views/HomeView.vue` and is mounted as the home route.

---

## Layout

- **Modals** (rendered only when their store getter is `true`):
  - `LoadXMLModal` — `showLoadXMLModal`
  - `LoadIIIFModal` — `showLoadIIIFModal`
  - `LoadLocalImage` — `showLoadLocalImage`
  - `ImageMismatchModal` — `showImageMismatchModal`
  - `MeasureModal` — `showMeasureModal`
  - `MdivModal` — `showMdivModal`
  - `PagesModal` — `showPagesModal`
  - `PageImportModal` — `showPageImportModal`
- **Loading overlay**: full-screen overlay shown while `loading` is `true`
- **Structural components**: `AppHeader`, `OsdComponent`, `ContentPreviewPane`, `AppSidebar`, `AppFooter`

---

## Props

_None_

---

## Data

_None_

---

## Computed Properties

Mapped from the Vuex store via `mapGetters`:

| Name                   | Description                                   |
|------------------------|-----------------------------------------------|
| showLoadXMLModal       | Whether the Load XML/MEI modal is visible     |
| showLoadIIIFModal      | Whether the Load IIIF modal is visible        |
| showLoadLocalImage     | Whether the Load Local Image modal is visible |
| showMeasureModal       | Whether the Measure modal is visible          |
| showMdivModal          | Whether the Mdiv modal is visible             |
| showPagesModal         | Whether the Pages modal is visible            |
| showPageImportModal    | Whether the Page Import modal is visible      |
| showImageMismatchModal | Whether the Image Mismatch modal is visible   |
| loading                | Whether the global loading overlay is shown   |

---

## Lifecycle

| Hook    | Description                                                                 |
|---------|-----------------------------------------------------------------------------|
| mounted | Registers a global `keyup` listener for editor shortcuts (see below).       |

---

## Keyboard Shortcuts

Shortcuts are ignored while the user is typing in an `input`, `textarea`, or `contenteditable` element.

| Key | Action                                                        |
|-----|---------------------------------------------------------------|
| m   | Toggles the measure list (`toggleMeasureList`)                |
| p   | Toggles the pages modal (`togglePagesModal`)                  |
| d   | Sets mode to `manualRect` (draw zone)                         |
| a   | Sets mode to `additionalZone`                                 |
| x   | Sets mode to `deletion`                                       |
| s   | Sets mode to `selection`                                      |

---

## Example

```vue
<HomeView />
```
