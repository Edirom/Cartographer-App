# Getting Started

Choose the option appropriate for your platform.

## Browser

No installation is required. Open the application URL provided by your
institution, for example <https://cartographer-app.zenmem.de/>.

## Native application

Cartographer can be distributed as a native application for Windows, macOS,
Linux, and Android. Download the package for your platform from the
[releases page](https://github.com/Edirom/cartographer-app/releases) or use the
download provided by your institution.

Only install native packages from a trusted source. Android packages may need
to be approved for installation if they are distributed outside an app store;
follow your institution's installation guidance.

### macOS: "Apple could not verify... is free of malware"

Cartographer's macOS builds are not currently notarized by Apple. Downloading
the `.dmg`/`.app` through a browser marks it as quarantined, so macOS shows
this warning when you first try to open it — this is expected for any
non-notarized app and does not mean the download is unsafe. To open it:

1. Try to open the app once (you'll see the warning) → **OK**.
2. Go to **System Settings → Privacy & Security**, scroll down to the blocked
   app notice, and click **Open Anyway**.
3. Try opening the app again and confirm **Open**.

### Android: "install blocked" / unknown sources

Android shows an "install from unknown sources" style warning for **any** APK
installed outside the Play Store or your device manufacturer's app store —
this happens whether or not the APK is signed, and is not specific to
Cartographer. Follow your device's on-screen prompt to allow the install
(usually **Settings → allow this source**, then retry the install).

## GitHub login on Android and desktop

Native Tauri applications use GitHub Device Flow rather than redirecting back
to the application through a callback URL:

1. Open the application menu and select **Login with GitHub**.
2. Copy the temporary code displayed by Cartographer.
3. Open <https://github.com/login/device> in a browser.
4. Enter the code and authorize Cartographer.
5. Return to Cartographer and wait for login to complete automatically.

The browser can be on the same device or another trusted device. Only enter a
code when you initiated the login yourself. See
[Importing from a GitHub repository](./actions.md#importing-from-a-github-repository)
for the complete workflow.
