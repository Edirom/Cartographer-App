# UUID Tool (`src/tools/uuid.js`)

A tiny helper for generating unique identifiers used throughout the app as MEI
element `xml:id`s (e.g. surfaces, graphics, zones, measures, and mdivs).

---

## Overview

- Generates an [RFC 4122 version 4](https://datatracker.ietf.org/doc/html/rfc4122)
  (random) UUID string.
- Uses `Math.random()` to fill the `x`/`y` template positions; the version nibble
  is fixed to `4` and the variant nibble to one of `8`, `9`, `a`, or `b`.
- Because MEI `xml:id`s must not begin with a digit, callers typically prefix the
  result with a letter (for example `'s' + uuid()` for a surface or `'m' + uuid()`
  for an mdiv).

---

## Exported Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `uuid()` | *(none)* | `string` — a version 4 UUID | Returns a random UUID in the canonical `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` form. |

---

## Example Usage

```js
import { uuid } from '@/tools/uuid.js'

const surfaceId = 's' + uuid() // e.g. "s3f2a1b4-9c8d-4e2f-a1b2-c3d4e5f6a7b8"
const mdivId = 'm' + uuid()
```
