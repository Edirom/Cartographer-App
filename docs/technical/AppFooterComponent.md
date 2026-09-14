# AppFooter Component

Displays the application footer, including the current mdiv label, zone count, loading status, and quick links to the About dialog and documentation.

---

## Overview

The `AppFooter` component provides:
- Display of the current mdiv (musical division) label (clickable, opens modal)
- Display of the number of zones on the current page
- Loading progress indicator
- An **About** link (opens the About modal) and a **Docs** link (opens the documentation)

> **Note:** Page navigation (previous/next and jump-to-page) is no longer part of the footer. It now lives in the sidebar, where the current page is an editable input that jumps to the entered page on **Enter** (there is no longer a "Go" button). See the **AppSidebar** documentation.

---

## Layout

- **Left**: Current mdiv label (clickable, opens modal)
- **Center**: Number of zones on the current page
- **Progress**: Shows loading progress bar if loading
- **Right**: About and Docs links

---

## Props

_None_

---

## Data

_None_

---

## Computed Properties

| Name           | Description                                              |
|----------------|---------------------------------------------------------|
| docsUrl        | URL of the documentation. Prefers the build-time `VUE_APP_DOCS_URL` (set for desktop/Android builds, which have no same-origin docs server); falls back to `<origin>/docs` for the web/Docker deployment. |
| isReady        | Whether the app is ready                                |
| isLoading      | Whether the app is currently loading                    |
| zonesCount     | Number of zones on the current page                     |
| mdivLabel      | Label for the current mdiv (musical division)           |

---

## Methods

| Name            | Description                                                      |
|-----------------|------------------------------------------------------------------|
| showMdivModal   | Opens the mdiv modal dialog                                      |
| showAbout       | Opens the About modal dialog                                     |

---

## Example

```vue
<AppFooter />

