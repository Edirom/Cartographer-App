# ImageMismatchModal Component

Displays a warning when the images referenced by a loaded MEI file do not match
the images that are actually available.

---

## Overview

The `ImageMismatchModal` component:
- Warns the user when there is a mismatch between the images referenced in an MEI
  file and the images that were loaded.
- Lists **missing images** (referenced by the MEI file but not available).
- Lists **unreferenced images** (loaded but not referenced by the MEI file).
- Blocks continuing while there are missing images, since those must be resolved.
- Allows continuing when only unreferenced images are present.
- Reads its state directly from the Vuex store.

---

## Layout

- **Header**: Modal title ("⚠️ Image Mismatch Warning") and close button.
- **Body**:
  - A list of missing images, each marked with a red "Missing" badge.
  - A list of unreferenced images, each marked with a blue "Unreferenced" badge.
  - An info box explaining what the mismatch means.
- **Footer**:
  - **Cancel & Start Over**: resets the loaded data and closes the modal.
  - **Continue (Unreferenced images only)**: shown only when there are
    unreferenced images and no missing images.
  - **Cannot Continue – Missing Images**: a disabled button shown when missing
    images are present.

---

## Props

_None_

---

## Computed Properties

| Name               | Description                                                       |
|--------------------|-------------------------------------------------------------------|
| showModal          | Whether the modal is visible (`state.showImageMismatchModal`)     |
| missingImages      | Images referenced in the MEI file but not available               |
| unreferencedImages | Images that were loaded but are not referenced in the MEI file    |

---

## Methods

| Name              | Description                                                            |
|-------------------|------------------------------------------------------------------------|
| closeModal        | Dispatches `closeImageMismatchModal` to hide the modal                 |
| cancelAndGoBack   | Resets all loaded data, closes the modal, and clears the file inputs   |
| continueWithWarning | Closes the modal only when there are no missing images               |

---

## Store Integration

### State
- `showImageMismatchModal`: Boolean indicating whether the modal is visible
- `missingImages`: Array of referenced-but-missing image paths
- `unreferencedImages`: Array of loaded-but-unreferenced image paths

### Actions
- `closeImageMismatchModal()`: Hides the modal
- `resetAll()`: Resets the loaded document data so the user can start over

---

## Workflow

1. An MEI file and its images are loaded (from a Git repository or local folder).
2. The store compares the image references in the MEI file with the available
   images.
3. If there is a mismatch, `showImageMismatchModal` is set and the modal appears.
4. The user reviews the missing and/or unreferenced images.
5. If only unreferenced images exist, the user may continue; if any images are
   missing, the user must start over and resolve the problem first.

---

## Technical Details

### Related Files

- **Component**: `src/components/ImageMismatchModal.vue`
- **Store**: `src/store/index.js`

### Dependencies

- Vue 3
- Vuex (for state management)
