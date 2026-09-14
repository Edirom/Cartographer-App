# AppSidebar Component

Provides the application sidebar with editing controls, autodetection tools, and page navigation.

---

## Overview

The `AppSidebar` component offers:
- Sidebar controls for editing and navigation
- Buttons for selection, drawing, adding, and deleting zones
- Undo and redo controls for reverting or reapplying changes
- Autodetection tools for measures/zones
- Page navigation controls, including an editable current-page input

---

## Layout

- **Top**: Mode buttons (select, draw, undo, redo, add zone, delete)
- **Middle**: Autodetection tools (e.g., autodetect measures)
- **Bottom**: Page navigation — an editable current-page input, the total page count, and previous/next arrows. Typing a page number and pressing **Enter** jumps to that page (there is no "Go" button).

---

## Props

_None_

---

## Data

| Name       | Type   | Description                                    |
|------------|--------|------------------------------------------------|
| inputPage  | String | User input for the current page (jump target)  |

---

## Computed Properties

| Name          | Description                                         |
|---------------|-----------------------------------------------------|
| isReady       | Whether the app is ready for user actions           |
| multiZone     | Whether multi-zone mode is active                   |
| currentPage   | Current page number (1-based)                       |
| maxPage       | Maximum page number                                 |
| prevAvailable | Whether the previous page is available              |
| nextAvailable | Whether the next page is available                  |
| mode          | Current sidebar mode (selection, drawing, etc.)     |
| measures      | Measures on the current page (from the store)       |
| canUndo       | Whether there is a previous state that can be undone |
| canRedo       | Whether there is an undone state that can be redone  |

---

## Methods

| Name           | Description                                                      |
|----------------|------------------------------------------------------------------|
| jumpToPage     | Jumps to the page entered in the input (triggered on **Enter**)  |
| showPrevPage   | Navigates to the previous page                                   |
| showNextPage   | Navigates to the next page                                       |
| autoDetect     | Automatically detects zones on the current page                  |
| autoDetectAll  | Automatically detects zones on all pages                         |
| activateMode   | Activates a specific mode (selection, drawing, etc.)             |
| undoChanges    | Dispatches the `undo` action to revert the last change           |
| redoChanges    | Dispatches the `redo` action to reapply an undone change         |

---

## Watchers

| Watched Property | Description                                 |
|------------------|---------------------------------------------|
| currentPage      | Updates `inputPage` when the page changes   |

---

## Example

```vue
<AppSidebar />