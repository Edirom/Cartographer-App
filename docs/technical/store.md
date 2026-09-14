# Store Directory

This documentation contains information related to the `store`.  
## Overview

This Vuex store manages all application state, including:
- Current MEI/XML document and page data
- Undo/redo history of the MEI document (capped at 50 snapshots)
- Modal visibility (for loading, editing, importing, etc.)
- Current selection (page, measure, mdiv, zone)
- GitHub integration (repositories and directories)
- IIIF manifest ingestion, local image import, and image-reference verification
- Annotation and zone management
- Editor modes (from `constants.js`) and processing/loading states

---

## Supporting Files

- **`index.js`** — the Vuex store itself (state, mutations, actions, getters). See [storeIndex.md](storeIndex.md) for the detailed reference.
- **`constants.js`** — exports the `mode` object enumerating the editor modes (`selection`, `manualRect`, `splitVertical`, `splitHorizontal`, `additionalZone`, `deletion`, `mdiv`, `login`).
- **`client_id.js`** — exports the GitHub OAuth client id from `process.env.VUE_APP_CLIENT_ID`.
- **`client_secret.js`** — exports the GitHub OAuth client secret from `process.env.VUE_APP_CLIENT_SECRET`.
- **`call_back.js`** — exports the GitHub OAuth callback URL from `process.env.VUE_APP_CALL_BACK`.