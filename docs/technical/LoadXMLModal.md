# LoadXMLModal Component

Displays a modal dialog for loading an MEI/XML file from the local file system.

---

## Overview

The `LoadXMLModal` component:
- Shows a modal dialog for loading an MEI/XML file from disk.
- Provides a "Load test data" button that fetches a bundled test file (`testfile.xml`).
- Parses the selected file as MEI and loads it into the store.
- Detects local (non-HTTP) image references in the MEI and, when present, switches to a folder-selection step so the user can pick the images folder.
- Matches the folder's images to the MEI targets (by full path or basename), converts them to pages, and preserves the original MEI zones.
- Modal can be closed with the Cancel button or overlay.
- Uses Vuex store for state management and actions.

---

## Layout

- **Header**: Modal title — "Load XML" normally, or "Select Images Folder" during the folder-selection step.
- **Body**:
  - Default view: a "Load test data" button and a file input accepting `.xml`/`.mei` files.
  - Folder-selection view: a message explaining the MEI references local images and a prompt to select the images folder.
  - A hidden folder input (`webkitdirectory`) used to pick the images folder.
- **Footer**:
  - Default view: Cancel and Load buttons.
  - Folder-selection view: Cancel and Select Folder buttons.

---

## Props

_None_

---

## Data

| Name                  | Type           | Description                                                                 |
|-----------------------|----------------|-----------------------------------------------------------------------------|
| currentMei            | Object \| null | Parsed MEI document held while awaiting image-folder selection               |
| localImageTargets     | Array          | Local (non-HTTP) image target paths found in the MEI                         |
| showSelectFolderModal | Boolean        | Whether the image-folder selection step is currently shown                   |
| loadedPages           | Array          | References to converted pages, kept to prevent blob URLs from being garbage collected |

_`testUri` (the bundled `testfile.xml` path) and `parser` (a `DOMParser`) are module-level constants, not component data._

---

## Computed Properties

_None_

---

## Lifecycle

| Hook    | Description                                                                              |
|---------|-----------------------------------------------------------------------------------------|
| mounted | Attaches a `change` handler to the hidden folder input that calls `loadImagesFromFolder` |

---

## Methods

| Name                 | Description                                                                                                   |
|----------------------|---------------------------------------------------------------------------------------------------------------|
| testData             | Fetches the bundled test file, parses it as MEI, dispatches `setData`, and closes the modal                    |
| main                 | Reads the chosen `.xml`/`.mei` file and parses it as MEI. If local image `<graphic>` targets are found, switches to the folder-selection step; otherwise dispatches `setData` and closes the modal |
| selectImagesFolder   | Opens the system folder picker via the hidden folder input                                                    |
| cancelSelectFolder   | Cancels the folder-selection step and resets its state (keeps `loadedPages`)                                  |
| loadImagesFromFolder | Filters image files, matches them to the MEI targets, converts them to pages, commits `SET_LOCAL_IMAGE_PAGES`, dispatches `addLocalImagePages` with the pages and original MEI, then closes the modal |
| closeModal           | Resets folder-selection state, clears the file input, and dispatches `toggleLoadXMLModal`                      |

---

## Example

```vue
<LoadXMLModal />