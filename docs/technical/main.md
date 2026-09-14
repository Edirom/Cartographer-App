# main.js (Application Entry Point)

Bootstraps and mounts the Vue application.

---

## Overview

`src/main.js` is the entry point of the Cartographer App. It:
- Creates the Vue application from the root [App](App.md) component
- Registers the Vue Router and Vuex store
- Imports the Spectre.css stylesheets (`spectre-exp.css`, `spectre-icons.css`, `spectre.css`)
- Registers the Font Awesome icon library and the `font-awesome-icon` / `font-awesome-layers` global components
- Mounts the app onto the `#app` element

---

## Plugins & Globals

| Item                                    | Purpose                                             |
|-----------------------------------------|-----------------------------------------------------|
| `router`                                | Client-side routing (see [router.md](router.md))    |
| `store`                                 | Vuex state management (see [storeIndex.md](storeIndex.md)) |
| `font-awesome-icon`                     | Global component for rendering single icons         |
| `font-awesome-layers`                   | Global component for layered icons                  |

The specific solid and regular Font Awesome icons used across the app are added to the library via `library.add(...)`.

---

## Mount

```js
createApp(App)
  .use(router)
  .use(store)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('font-awesome-layers', FontAwesomeLayers)
  .mount('#app')
```
