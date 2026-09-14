# LoadLocalImage Component

Displays a modal dialog for importing images from the local file system.

---

## Overview

The `LoadLocalImage` component:
- Shows a modal dialog for the user to select a local folder containing images.
- Automatically filters and displays supported image files.
- Allows the user to preview the list of detected images before importing.
- On confirmation, converts local images to pages and imports them into the application.
- Loads the selected images as a fresh set (previously loaded MEI zones and measures are not preserved).
- Uses Vuex store for state management and actions.
- Supports various image formats: JPG, JPEG, PNG, GIF, WebP, SVG, BMP, and TIFF.

---

## Layout

- **Header**: Modal title ("Load Local Images") and close button.
- **Body**:
  - File input field with label "Choose Folder" (webkitdirectory for folder selection).
  - Image info section showing the count of detected images (and a note about how many non-image files were ignored).
  - Scrollable list of detected image files with their paths.
- **Footer**: Cancel and Import buttons.

---

## Props

_None_

---

## Data

| Name                | Type   | Description                                 |
|---------------------|--------|---------------------------------------------|
| selectedImages      | Array  | Array of image file objects with name and file properties |
| selectedFolderPath  | String | Path of the selected folder                  |
| totalFilesSelected  | Number | Total number of files chosen in the folder (including non-image files) |

---

## Methods

| Name                 | Description                                                      |
|----------------------|------------------------------------------------------------------|
| handleFolderSelection| Processes folder selection, records the total file count, filters image files, and populates the selectedImages array |
| importImages         | Sorts and converts the selected images to pages and dispatches them to the store as a fresh load (no MEI preservation); dispatches an empty import when no images are selected |
| closeModal           | Closes the modal and resets data to initial state |

---

## Computed Properties

_None_

---

## Store Integration

### Getters
- `showLoadLocalImage`: Boolean indicating whether the modal is visible

### Mutations
- `TOGGLE_LOADLOCALIMAGE_MODAL(state, value)`: Sets or toggles the modal visibility state
- `SET_LOADING(state, value)`: Toggles the global loading indicator (set while images are converted, cleared on error)

### Actions
- `addLocalImagePages(pages)`: Adds the converted images as pages to the store. This component dispatches the pages array directly (or `[]` when no images are selected) so images are loaded as a fresh set without preserving prior MEI data
- `toggleLoadLocalImage()`: Toggles the modal visibility

---

## Image File Support

The component automatically filters and accepts the following image formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)
- BMP (.bmp)
- TIFF (.tiff)

Non-image files are ignored during folder selection.

---

## Workflow

1. User clicks "Import Local Image" from the main menu.
2. Modal opens with a folder selection input.
3. User selects a folder using the "Choose Folder" button.
4. Component scans the folder and filters image files.
5. Detected images are displayed in a scrollable list.
6. User reviews the image list and clicks "Import" to proceed.
7. Images are converted to pages using `convertLocalImagesToPages()` utility.
8. Images are loaded as a fresh set; previously loaded MEI zones and measures are not preserved.
9. Pages are added to the store via `addLocalImagePages` action.
10. The modal closes as soon as Import is clicked (before conversion completes).

---

## Key Features

- **Folder-based selection**: Uses `webkitdirectory` attribute for selecting entire folders.
- **Image filtering**: Automatically detects and filters only image files.
- **Preview before import**: Users can see all detected images before importing.
- **Fresh load**: Images are always imported as a new set; any previously loaded MEI zones and measures are not preserved.
- **Error handling**: Displays alerts if image loading fails and logs errors to console.
- **Sorted imports**: Images are sorted by filename using `sortImageFiles()` utility before import.

---

## Technical Details

### Related Files

- **Component**: `src/components/LoadLocalImage.vue`
- **Store**: `src/store/index.js`
- **Utilities**: `src/tools/localImages.js` (contains `convertLocalImagesToPages` and `sortImageFiles`)

### Dependencies

- Vue 2
- Vuex (for state management)
- localImages.js utility functions

### Browser Support

The component relies on the `webkitdirectory` attribute for folder selection, which is supported in:
- Chrome/Edge 50+
- Firefox 50+
- Safari 13.1+

---

## User Interactions

| Interaction | Action |
|---|---|
| Click "Choose Folder" | Opens system folder picker |
| Select folder | Populates image list if images are found |
| Click "Cancel" | Closes modal, clears selections |
| Click modal overlay | Closes modal (same as Cancel button) |
| Click "Import" | Closes the modal and imports the converted images |

---

## Error Handling

- If no images are found in the selected folder, clicking Import dispatches an empty import (`addLocalImagePages([])`) instead of loading any pages.
- If image conversion fails, an alert is shown and error details are logged to the browser console.
- The modal closes as soon as Import is clicked, so conversion errors surface via an alert after the modal has already closed.

---

## Example Usage

```vue
<!-- In MainMenu.vue -->
<li class="menu-item">
  <button class="btn btn-action btn-sm" @click="importLocalImage" title="import Local Image">
    <font-awesome-icon icon="fa-solid fa-file-import"/> 
  </button>
  Import Local Image
</li>

<!-- In script -->
methods: {
  importLocalImage: function () {
    this.$store.dispatch('toggleLoadLocalImage')
  }
}
```

---

## Notes

- The component closes immediately when Import is clicked; `importImages()` calls `closeModal()` (committing `TOGGLE_LOADLOCALIMAGE_MODAL`) before the image conversion completes.
- Image paths are preserved with their relative folder structure (e.g., "folderName/subfolder/image.jpg").
- The component works best with reasonably-sized image folders; very large folders (1000+ images) may take time to process.
