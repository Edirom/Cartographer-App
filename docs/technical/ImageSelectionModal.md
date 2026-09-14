# ImageSelection Modal 

Displays a modal dialog for selecting or entering an image manifest URL.

---

## Overview

The `ImageSelectionModal` component:
- Shows a modal dialog (currently a placeholder) for the user to input or select a manifest URL.
- Uses the Vuex store to control modal visibility and manage the manifest URL.
- On confirmation, triggers actions to load the manifest.

---

## Layout

- **Modal**: (Currently a placeholder `<div v-if="visible">Hello</div>`)
- **(Commented)**: Modal with header, body, input for URL, and confirmation button.

---

## Props

_None_

---

## Computed Properties

| Name    | Description                                         |
|---------|-----------------------------------------------------|
| visible | Modal visibility (read-only getter from Vuex store) |
| url     | Manifest URL, two-way synced with Vuex store        |

---

## Methods

| Name         | Description                                                      |
|--------------|------------------------------------------------------------------|
| openManifest | Hides the modal and dispatches actions to load the manifest      |

---

## Example

```vue
<ImageSelectionModal />