# Testing — Drawing on Small Screens & Responsive Display (#107)

Manual test plan for the responsive layout and touch drawing changes.

## Setup

```bash
npm run serve
```

Open <http://localhost:8080/myAppPlaceholder/>, then load an image / XML so the
canvas and page controls are active.

To test phone sizes without a device: Chrome DevTools → **Cmd+Shift+M**
(Device Toolbar), then pick a device or drag to a custom width.

## A. Responsive layout

Test at **320px, 375px, 412px, 768px, and desktop**:

- [ ] Red **footer is visible at the bottom** on every size (the original iPhone mini bug).
- [ ] Footer contents (page nav, `zones: N`, mdiv label, progress) **fit without being cut off**.
- [ ] No **horizontal scrollbar** on the page.
- [ ] Header title **"cartographer-app" isn't clipped**; menu button reachable.
- [ ] Rotate to **landscape** — footer still pinned to the bottom.
- [ ] Desktop layout is **unchanged** from before.

## B. Touch drawing (core of #107)

In Device Mode (touch emulated) **or** on a real touchscreen:

- [ ] Tap the **pen / "draw measures"** tool → drag on the canvas → a rectangle is drawn and a zone is created.
- [ ] Draw **several rectangles in a row** without re-selecting the tool.
- [ ] Tap the **arrow / "select"** tool → dragging now **pans** the image (no accidental drawing).
- [ ] **Pinch-zoom** works in select mode.
- [ ] The **"add zone to last measure"** tool also draws by touch.

## C. Desktop regression (mouse)

- [ ] Select the draw tool and drag with the mouse → draws (no Shift needed).
- [ ] Select tool → mouse drag pans; existing zones are still clickable / selectable.

## D. Edge cases

- [ ] Switching pages / loading a new file keeps the correct tool behavior.
- [ ] iOS Safari (if reachable): footer clears the home indicator; no content hidden behind the toolbar.

## Testing on a physical phone

The dev server runs on your computer; the phone opens it over the local network.
Both devices must be on the **same Wi-Fi**.

1. **Start the dev server** (it already binds to all interfaces via `vue.config.js`):
   ```bash
   npm run serve
   ```

2. **Find your computer's local IP address:**
   - macOS:
     ```bash
     ipconfig getifaddr en0 || ipconfig getifaddr en1
     ```
   - Linux:
     ```bash
     hostname -I | awk '{print $1}'
     ```
   - Windows (PowerShell):
     ```powershell
     (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*'}).IPAddress
     ```
   You'll get something like `192.168.1.42` (or `100.64.x.x` on some networks).

3. **On the phone**, open a browser and type the full URL (include `http://`):
   ```
   http://<YOUR-IP>:8080/myAppPlaceholder/
   ```
   Example: `http://192.168.1.42:8080/myAppPlaceholder/`

4. **Run the checks** in sections A and B above (footer visible at the bottom,
   draw with a finger using the pen tool, pan/pinch with the select tool).

### If the page won't load on the phone

Try these in order:

- **Same network:** confirm the phone is on the **exact same Wi-Fi** as the
  computer — not a "guest" SSID, and not on mobile data.
- **Turn off VPN / iCloud Private Relay** on the phone
  (iOS: Settings → Apple Account → iCloud → Private Relay → **Off**; and disable any VPN).
- **Firewall:** allow incoming connections to `node`
  (macOS: System Settings → Network → Firewall).
- **Quick reachability test:** on the phone open `http://<YOUR-IP>:8080/` — if even
  this hangs, the phone genuinely can't reach the computer.
- **Client isolation:** many home/guest routers block device-to-device traffic.
  Work around it by creating a **personal hotspot** on a third device, connect
  **both** the computer and phone to it, then re-run step 2 to get the new IP.

> Note: OAuth/GitHub login won't work over a raw IP (the callback URL is
> registered for a specific origin). Drawing and zone editing still work.
