# Router

Defines the client-side routes for the application using Vue Router.

---

## Overview

`src/router/index.js` creates the router instance with HTML5 history mode (`createWebHistory(process.env.BASE_URL)`) and registers the application routes.

---

## Routes

| Path        | Name       | Component                        | Description                                        |
|-------------|------------|----------------------------------|----------------------------------------------------|
| `/`         | `home`     | [HomeView](HomeView.md)          | The main editor view (eagerly imported).           |
| `/callback` | `callback` | [Auth](Auth.md) (lazy-loaded)    | GitHub OAuth callback handler.                     |

The `/callback` route is code-split (lazy-loaded) so its chunk is only fetched when the route is visited.

---

## Notes

- `../public-path.js` is imported for correct asset base-path resolution (relevant for micro-frontend / sub-path deployments).
- History mode is used, so the server must be configured to fall back to `index.html` for unknown paths.

---

## Example

```js
import router from './router'

createApp(App).use(router).mount('#app')
```
