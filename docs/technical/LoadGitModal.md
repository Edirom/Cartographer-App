# LoadGitModal Component

Displays a modal dialog for importing a Git repository path.

---

## Overview

The `LoadGitModal` component:
- Shows a modal dialog for the user to input a Git repository path.
- Allows the user to trigger import actions or cancel the dialog.
- Uses Vuex store for state management and actions.
- (Some directory/branch selection UI is commented out for future use.)

---

## Layout

- **Header**: Modal title and close button.
- **Body**: Input field for the Git repository path.
- **Footer**: Cancel and Import buttons.

---

## Props

_None_

---

## Data

| Name             | Type   | Description                        |
|------------------|--------|------------------------------------|
| selectedDirectory| String | Selected directory (future use)    |
| inputValue       | String | Input value (future use)           |

---

## Computed Properties

| Name           | Description                                         |
|----------------|-----------------------------------------------------|
| getRepositorys | Returns available Git repositories from the store   |
| getRepository  | Returns the selected Git repository from the store  |
| gerBranches    | Returns available Git branches from the store       |

---

## Methods

| Name         | Description                                                      |
|--------------|------------------------------------------------------------------|
| useTestUri   | Sets the input field to a test URI (not used)                    |
| main         | Dispatches the `setBranches` action with the given path to load the repository's branches (import logic is currently commented out) |
| closeModal   | Closes the modal dialog                                          |

---

## Example

```vue
<LoadGitModal />