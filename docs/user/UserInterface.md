# User Interface

## Window

The Cartographer App window consists of the following parts:

1. **Header (Top Bar)** — contains the title and a dropdown menu button.
2. **Sidebar (Right Panel)** — contains tools for editing and page navigation.
3. **Main Working Area** — the central editing space.
4. **Footer (Bottom Bar)** — displays status information about mdivs and zones, along with the About and Docs links and partner logos.

---

## Header

The header contains a **title** and a **dropdown menu button**. Once you are logged in with GitHub, your **GitHub avatar** also appears in the header, and clicking the avatar shows the **Logout** option.

Clicking the menu reveals options for uploading or downloading MEI files, importing IIIF image files, and logging in with GitHub. When logged in, the menu additionally contains an option to load files from GitHub.
Additionally, the header includes buttons to open the **Page Overview** and toggle the **Measure List**.

---

### Menu Bar

Clicking the dropdown menu in the header opens the following options:

1. **Upload MEI File** — upload an MEI file from your local repository.
2. **Import IIIF Manifest** — import an IIIF manifest from a server.
3. **Import Local Image** — import images directly from a folder on your computer.
4. **Login with GitHub** — sign in with your GitHub account. Browser builds use
   an OAuth redirect; Android and desktop Tauri builds use Device Flow.
5. **Load from GitHub** — import MEI files and images from your GitHub repositories (only visible when logged in with GitHub).
6. **Download MEI File** — download a rendered MEI file from Cartographer.
7. **Show Page Overview** — display all imported images and add more images.
8. **Toggle Measure List** — show or hide a list of all movements and measures in a sidebar.

### Native GitHub login prompt

After selecting **Login with GitHub** in an Android or desktop Tauri build, a
sign-in card appears near the top-right corner. It contains:

- The GitHub verification URL
- A temporary device code
- A button for copying the code
- A waiting-for-authorization status message

Open the verification URL, enter the code, and authorize Cartographer. Keep the
application open while it waits for GitHub. The card closes when login
succeeds. If an error is shown or the request times out, start the login again
to request a new code.

Only enter the code if you initiated the login from Cartographer. See
[Actions](./actions.md#importing-from-a-github-repository) for step-by-step
instructions.

---

## Footer

The footer is a single row containing:

1. **Mdiv status display** — shows the current mdiv (movement), only appears when there is a zone drawen on the image.
2. **Zone counter** — shows the total number of zones on the current page.
3. **Loading indicator** — shown while the app is processing.
4. **About** — opens the About dialog with the app description, version, and resource links.
5. **Docs** — opens this documentation.


---

## Sidebar

The sidebar contains the following tools:

1. **Select Regions** — choose and adjust existing regions.
2. **Draw Rectangles** — create new rectangular zones.
3. **Undo** — revert the last change (disabled when there is nothing to undo).
4. **Redo** — reapply a change that was undone (disabled when there is nothing to redo).
5. **Add Measures to Zone** — insert additional measures within the same zone.
6. **Erase Measures** — remove selected measures.
7. **Automatic Measure Detection** — run the detector to identify measures automatically.
8. **Page Navigation** — move between pages using the previous/next arrows, or type a page number into the current-page field and press **Enter** to jump directly to that page.

---

## Keyboard Shortcuts

Editing modes and panels can be toggled with keyboard shortcuts. Shortcuts are
ignored while you are typing in a text field.

| Key | Action |
| --- | --- |
| `s` | Selection mode — select an existing measure |
| `d` | Draw mode — draw a new measure zone |
| `a` | Additional-zone mode — add another zone to the last measure |
| `x` | Deletion mode — delete a measure |
| `m` | Toggle the measure list |
| `p` | Toggle the pages overview |