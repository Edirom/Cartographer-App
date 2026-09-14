# App (Root Component)

The root component of the application. It renders only the active route's component through `<router-view>`.

---

## Overview

`App` is the top-level component mounted onto `#app` (see [main.md](main.md)). It contains no logic of its own — it delegates entirely to the router, which selects between the home editor view and the OAuth callback view.

---

## Template

```vue
<template>
  <router-view></router-view>
</template>
```

---

## Related

- [main.md](main.md) — application entry point that mounts this component
- [router.md](router.md) — route definitions rendered inside `<router-view>`
- [HomeView.md](HomeView.md) — the default (`/`) route content
