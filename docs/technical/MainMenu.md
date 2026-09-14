# MainMenu Component

`MainMenu` provides file import and export actions, GitHub integration, page
controls, and the native GitHub Device Flow prompt.

## Layout

The dropdown is opened with the bars button and contains these sections:

- **User**: Upload MEI, import IIIF or local images, log in with GitHub, load
  from GitHub, and download MEI
- **GitHub branch**: Commit the loaded GitHub file when GitHub file metadata is
  available
- **Actions**: Show the page overview and toggle the measure list
- **Options**: Toggle merge mode when unzoned measures are available

The Device Flow sign-in card is outside the dropdown so it remains visible when
the menu closes. It is rendered only while `auth.state.devicePrompt` contains a
verification URL and user code.

## Props

_None_

## Computed properties

| Name | Description |
| --- | --- |
| `manifest` | Current IIIF manifest from the root store |
| `xmlFilename` | Filename used when downloading MEI |
| `downloadAvailable` | Whether generated MEI is available |
| `firstMeasureWithoutZone` | First measure eligible for merge mode |
| `existingMusicMode` | Whether merge mode is active |
| `isAuthenticated` | Authentication status from `auth/isAuthenticated` |
| `githubFile` | Metadata for the MEI file loaded from GitHub |
| `selectedBranch` | Branch selected in the authentication module |
| `githubBranchLabel` | Branch label displayed above the commit action |
| `devicePrompt` | Native Device Flow URL and temporary user code |

## Methods

| Name | Description |
| --- | --- |
| `importXML` | Opens the MEI upload modal |
| `importManifest` | Opens the IIIF import modal |
| `importLocalImage` | Opens the local-image import modal |
| `loadFromGithub` | Opens the GitHub repository browser |
| `loginToGithub` | Selects browser OAuth or native Device Flow |
| `copyDeviceCode` | Copies the temporary Device Flow code |
| `commitToGithub` | Opens the GitHub commit modal |
| `xmlDataUrl` | Creates the data URL used to download MEI |
| `toggleMeasureList` | Shows or hides the measure list |
| `showPagesModal` | Opens the page overview |
| `toggleExistingMusicMode` | Toggles merge mode when available |

## Authentication behavior

`loginToGithub` checks `window.__TAURI_INTERNALS__`:

- In a browser, it dispatches `auth/login`, which starts OAuth redirect login.
- In a Tauri desktop or Android application, it dispatches
  `auth/loginDevice`, which requests a device code through the Rust backend.

During Device Flow, the component displays the verification URL, temporary
code, copy button, and waiting status. Login errors are shown through an alert.
The store handles GitHub's polling interval and updates authentication state
when authorization succeeds.

See [GitHub Authentication](./Auth.md) for the complete browser and native
flows.

## Example

```vue
<MainMenu />
```