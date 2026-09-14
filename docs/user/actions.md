# Actions

---

## Importing Images

In the **Cartographer App**, there are four ways to import images:

1. From a local MEI file — the file references images hosted on a IIIF server.
2. Directly from a IIIF server — by providing the IIIF manifest link.
3. From a local folder — by importing image files stored on your computer.
4. From a GitHub repository — by loading MEI files and images from your repositories (requires logging in with GitHub).

---

### Importing from a Local MEI File

Click the **menu icon** in the header to open the options.
Select **"Upload MEI File"** to import an MEI XML file.

- You can load the provided **test dataset** by clicking **"Load Test Data"**.
- Or click **"Choose File"** to open a file selection dialog and upload your own MEI file.
- After selecting a file, click **"Load"** to complete the import.
- To cancel, click **"Cancel"**.

If the MEI file references **local images** (rather than images hosted on a IIIF
server), another window will pop up after loading, asking you to choose the
referenced images from your computer.

#### Step-by-Step

1. Click the **menu button** in the header.
2. Choose one of the following:
   - **"Load Test Data"** → imports the sample dataset provided with Cartographer.
   - **"Choose File"** → opens a dialog to select a file from your computer.
3. Click **"Load"** to import the file.
4. If the MEI file references local images, a second dialog opens — select the corresponding image files (or folder) from your computer to complete the import.
5. (Optional) Click **"Cancel"** to exit without importing.

---

### Importing Directly from a IIIF Server

Click the **menu icon** in the header to open the options.
Select **"Import IIIF Manifest"** to import images directly from a IIIF server.

When you select **"Import IIIF Manifest"**, a dialog appears:

- **"Get Test URI"** → load the provided test manifest URI.
- **"Paste Your URI"** → manually paste your own IIIF manifest URI in the input box.
- **"Import"** → confirm and load the images.
- **"Cancel"** → close the dialog without importing.

#### Step-by-Step

1. Click the **menu button** in the header.
2. Choose one of the following:
   - **"Get Test URI"** → use the sample manifest provided with Cartographer.
   - **"Paste Your URI"** → enter your own IIIF manifest URI in the input field.
3. Click **"Import"** to load the images.
4. (Optional) Click **"Cancel"** to close the dialog.

---

### Importing from a Local Folder

Click the **menu icon** in the header to open the options.
Select **"Import Local Image"** to import images from a folder on your computer.

- Click **"Choose Folder"** to select a folder containing your images.
- The dialog lists every detected image so you can review them before importing.
- Click **"Import"** to add the images as pages.
- To cancel, click **"Cancel"**.

Supported formats include JPG, JPEG, PNG, GIF, WebP, SVG, BMP, and TIFF (including
TIFF files that store their pixel data as an embedded JPEG). If the images do not
match the references of a loaded MEI file, an **Image Mismatch Warning** is shown
so the difference can be resolved before continuing.

---

### Importing from a GitHub Repository

To load files from GitHub, you first need to log in. The login steps depend on
how you run Cartographer.

#### Browser login

1. Click the **menu button** in the header and select **Login with GitHub**.
2. Authorize Cartographer on GitHub.
3. GitHub redirects you back to Cartographer. Your GitHub avatar appears in the
   header when login is complete.

#### Android and native application login

The Android and desktop Tauri applications use GitHub Device Flow instead of a
browser callback:

1. Click the **menu button** and select **Login with GitHub**.
2. Cartographer displays a temporary device code and a GitHub verification URL.
3. Copy the code using the button beside it.
4. Open <https://github.com/login/device> in a browser. This can be on the same
   device or another trusted device.
5. Enter the code and authorize Cartographer.
6. Return to Cartographer. The app waits for authorization and completes login
   automatically; your GitHub avatar then appears in the header.

Only enter a device code when you initiated the login from Cartographer. Device
codes expire; start the login again if the code expires or the request times
out.

Once logged in, select **Load from GitHub** in the header menu:

1. Select the repository you want to load from (private repositories are supported).
2. Choose the **branch** to load from.
3. To import an MEI file: go to the **Import MEI** tab, select the file, and click **"Load MEI"**.
4. To import images: go to the **Import Images** tab, navigate to a folder containing images, and click **"Import Images"**.

---

## Committing Changes to GitHub

If you loaded your MEI file from GitHub, you can save your changes back to the repository without leaving the app:

1. Click your **GitHub avatar** in the header and select **"Commit to GitHub"**.
2. The dialog shows the current commit destination (repository, branch, and file path). By default, the file is committed back to where it was loaded from.
3. Optionally, you can change the destination:
   - **Commit to a different repository** — select another of your repositories.
   - **Commit to a different branch** — choose an existing branch or create a new one.
   - **Change file path / name** — edit the path where the file will be saved.
4. Enter a **commit message** and confirm.

If the file was modified on GitHub after you loaded it, a **conflict warning** is
shown instead of silently overwriting the changes; you can then commit to a
different branch or path to resolve it.

---

## Download MEI File

Click **"Download MEI File"** in the header menu to save the current MEI file to your local machine.

---

## Show Page Overview

Click **"Page Overview"** in the header menu to display a list of all pages with detailed information.
This view also contains a button to copy and paste a IIIF manifest (**"Import Images"**).

---

## Toggle Measure List

Click **"Toggle Measure List"** in the header menu to show or hide the list of musical measures next to the right toolbar.

---

## Selecting Regions

Click **Select** <i class="fa-solid fa-arrow-pointer"></i> in the sidebar to choose and adjust existing regions.

---

## Drawing Measures

Click **Draw** <i class="fa-solid fa-pencil"></i> in the sidebar to draw measures.
Hold the **Shift** key and drag to create the region.

---

## Adding Multiple Measures

Click **Add Measures** <i class="fa-solid fa-plus"></i> to insert additional measures with the same number.
Hold the **Shift** key and draw the next measure adjacent to the previous one.

---

## Erasing Measures

Click **Erase** <i class="fa-solid fa-eraser"></i> to delete a measure.
After deletion, don't forget to deactivate the erase tool.

---

## Automatic Measure Detection

Click **Automatic Detection** <i class="fa-solid fa-wand-magic-sparkles"></i> to run measure detection on the current page.

---

## Undo and Redo

Use **Undo** <i class="fa-solid fa-rotate-left"></i> in the sidebar to revert the
last change, and **Redo** <i class="fa-solid fa-rotate-right"></i> to reapply a
change that was undone. Each button is disabled when there is nothing to undo or
redo. Up to 50 previous states are kept.

---

## Navigate Through Pages

Use the **Previous** <i class="fa-solid fa-chevron-left"></i> and **Next** <i class="fa-solid fa-chevron-right"></i> navigation buttons in the sidebar.
To jump to a specific page, type the page number into the current-page field in the sidebar and press **Enter**.

---

## Create a New Movement

Double click a measure where you want to start a new movement.
From the dropdown, select **"new-mdiv"**, then click **"Close"** to confirm.

---

## Change Measure Labels

Double click the measure you want to edit.
Enable **"Explicit @label"**, type the new label, and click **"Close"**.

---

## Add Multiple Measure Rest

Enable **"Multiple Measure Rest"**.
Enter the number of measures in the input box, then click **"Close"**.

---

## Change Movement Label

Click the **"Movement"** button in the lower left corner of the footer.
Edit the movement name in the input box.
When finished, click **"Close"**.

---

## Change Movement

To change the movement of a measure, double-click on the measure you want to edit.
A new window will appear.

From this window, choose the movement to which the selected measure should belong.
- If the current movement is **before** the new one, the measure and all following measures will be reassigned.
- If the current movement is **after** the new one, the measure and all previous measures will be reassigned.

---

## Keyboard Shortcuts

The editing modes and side panels can be toggled with the keyboard. Shortcuts are
ignored while typing in a text field.

| Key | Action |
| --- | --- |
| `s` | Selection mode — select an existing measure |
| `d` | Draw mode — draw a new measure zone |
| `a` | Additional-zone mode — add another zone to the last measure |
| `x` | Deletion mode — delete a measure |
| `m` | Toggle the measure list |
| `p` | Toggle the pages overview |