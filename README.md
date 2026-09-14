[![fair-software.eu](https://img.shields.io/badge/fair--software.eu-%E2%97%8F%20%20%E2%97%8F%20%20%E2%97%8B%20%20%E2%97%8F%20%20%E2%97%8B-orange)](https://fair-software.eu) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Edirom/cartographer-app)
[![FAIR checklist badge](https://fairsoftwarechecklist.net/badge.svg)](https://fairsoftwarechecklist.net/v0.2?f=31&a=32113&i=31322&r=133)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![GitHub release](https://img.shields.io/github/v/release/Edirom/cartographer-app.svg)](https://github.com/Edirom/cartographer-app/releases)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17396487.svg)](https://zenodo.org/records/21889807)

# Cartographer App

The Cartographer App is used to provide placement information of zones of interest
in (historical) documents. The first and foremost use case is the identification
of bounding boxes of measures in music documents. It is a successor of the
*Vertaktoid*, but other than that is built on web technologies (Vue.js) and is
thus [platform independent](#platform-independence). It optionally uses the
*Measure Detector* for automatic recognition of measure positions, but allows
manual correction of these results.

## Used by

The Cartographer App is used by historical digital edition projects,
including but not limited to:

* [VerDigital](https://verdigital-unipv.github.io/) — a model for an interactive digital critical edition of Italian 19th-century opera (University of Pavia)
* [Beethoven in the House](https://domestic-beethoven.eu/) — research project on domestic arrangements of Beethoven's music and their digital exploration (University of Oxford, Beethoven-Haus Bonn, University of Paderborn)
* [Carl-Maria-von-Weber-Gesamtausgabe](https://weber-gesamtausgabe.de/en/Index) — complete scholarly edition of Carl Maria von Weber's musical works, letters, diaries, and writings (Academy of Sciences and Literature Mainz / University of Paderborn)
* [Tanz/Musik digital](https://www.muwi-detmold-paderborn.de/forschung/tanz-musik-digital) — DFG-funded project developing an edition method that digitally links the diverse sources on historical dance — iconographic documents, music sources, and texts — in a multimodal structural model  (Musikwissenschaftliches Seminar Detmold/Paderborn)
*  [Beethovens Werkstatt](https://beethovens-werkstatt.de/) — Long-term research project investigating Beethoven’s compositional processes through sketches, working manuscripts, and correction lists, and presenting the findings in exemplary digital editions (Beethoven-Haus Bonn; Musikwissenschaftliches Seminar Detmold/Paderborn, Paderborn University; Academy of Sciences and Literature Mainz).
*  [Erich Wolfgang Korngold Complete Edition](https://www.korngold-werkausgabe.de/en) — A scholarly hybrid-edition project publishing Korngold’s complete musical works—including stage, concert, chamber, and film music—in print and digital formats (Berlin-Brandenburg Academy of Sciences and Humanities,  Academy of Sciences and Literature Mainz, Humboldt University of Berlin, University of Music and Theatre Rostock; Goethe University Frankfurt,  Zentrum Musik – Edition – Medien (ZenMEM)  Paderborn University).
*  [Detmold Court Theatre](https://hoftheater-detmold.de/) — DFG-funded project developing a reusable MEI- and TEI-based model for the contextual description and digital presentation of musical and archival sources from the Detmold Court Theatre between 1825 and 1875 (Musikwissenschaftliches Seminar Detmold/Paderborn, Paderborn University; Lippische Landesbibliothek Detmold).
## Platform Independence

The Cartographer App is platform independent in the sense that a single,
web-based codebase runs on any operating system — there are no separate,
platform-specific implementations to maintain. From this one codebase, the
app can be delivered through three channels:

* **Browser**: used directly in any modern web browser, with no installation
  required
* **Web service**: deployed as a containerized service (Docker) and hosted
  by an institution for its users
* **Native application**: packaged via the Tauri integration as an
  installable application for Windows, macOS, Linux, and Android — e.g., for
  offline use or for environments where locally installed software is
  preferred. GitHub login works natively via the device flow, see
  [Native application development](#native-application-development-tauri).

## Features

### Image Import

The Cartographer App supports importing images from multiple sources:

* **Local Images**: Import images directly from your local file system
* **IIIF**: Load images from IIIF servers for standardized access to cultural heritage materials
* **Git Repositories**: Load MEI files with associated images from Git repositories

## Documentation

Comprehensive user and developer documentation for the Cartographer App is
available at: https://cartographer-app.zenmem.de/docs/

### Important Tools and their Documentation

* Vectre, which is a VueJS version of Spectre CSS. See https://vectrejs.github.io/docs/#/pages/getting-started
* OpenSeadragon. See http://openseadragon.github.io/
* Annotorious OpenSeadragon Plugin. See https://recogito.github.io/annotorious/getting-started/osd-plugin/
* Tauri, used to package the app as a native desktop and Android application. See https://tauri.app/

## Prerequisites

**Node.js v20.0.0 or higher is required.** This project uses dependencies that mandate Node v20+. Using an older version of Node will result in installation errors.

## Project setup

### Clone the Repository

```bash
git clone https://github.com/Edirom/cartographer-app.git
cd cartographer-app
```

### Install Dependencies

```bash
npm install
```

If you encounter peer dependency errors, use:

```bash
npm install --legacy-peer-deps
```

For a complete fresh install, try:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Run the web app in development

```sh
npm run serve
```

The development server is available at
<http://localhost:8080/myAppPlaceholder/>.

### Build the web app for production

```sh
npm run build
```

### Run the unit tests

```sh
npm run test:unit
```

### Lint and fix files

```sh
npm run lint
```

To run Standard with automatic fixes and format its output with Snazzy:

```sh
npm run test:lint
```

### Run the documentation locally

```sh
npm run docs:dev
```

VuePress prints the local documentation URL when the server is ready. The
configured documentation path is `/myAppPlaceholder/docs/`. If port 8080 is
already used by the web app, choose another port:

```sh
npm run docs:dev -- --port 8081
```

Build the production documentation with:

```sh
npm run docs:build
```

The generated static site is written to `docs/.vuepress/dist/`.

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### Local development with GitHub authentication

1. Register a GitHub OAuth App at **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**:
   - **Homepage URL:** `http://localhost:8080`
   - **Authorization callback URL:** `http://localhost:8080/myAppPlaceholder/callback`
   - Click **Generate a new client secret** and copy it.
2. Create your local env file from the tracked example and fill in your credentials:
```sh
   cp .env.local.example .env.local
```
```ini
   GH_APP_CLIENT_ID=<your-client-id>
   GH_APP_CALL_BACK=http://localhost:8080/myAppPlaceholder/callback
   GH_APP_CLIENT_SECRET=<your-client-secret>
```
   `.env.local` is gitignored, so your secret never gets committed.
3. Install and run:
```sh
   npm install
   npm run serve
```
   The dev server proxies `/auth` to GitHub's token endpoint with the
   `client_secret` injected server-side — it stays in the Node dev-server
   process and is never bundled into the browser, mirroring what nginx does in
   production.

### Native application development (Tauri)

The app can be packaged as a native application via [Tauri](https://tauri.app/).
The Rust core lives in `src-tauri/`; the frontend is the same Vue codebase.

#### Prerequisites

In addition to Node.js v20+:

* **Rust** (stable) — install via [rustup](https://rustup.rs/)
* **For Android builds additionally:**
  * JDK 17 (e.g. Temurin; newer JDKs may work, but the Android Gradle Plugin
    targets 17 — Java 8/11 will fail)
  * Android SDK with platform-tools, build-tools, and the **NDK**
  * Rust Android targets:
    `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`
  * Environment variables (e.g. in `~/.zshrc`):
    ```sh
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export NDK_HOME="$ANDROID_HOME/ndk/<version>"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
    ```

#### Desktop (Windows/macOS/Linux)

```sh
npm run tauri:dev                        # development with hot reload
npm run tauri:build                      # installable package for the host OS
npm run tauri:build -- --bundles app     # macOS: skip DMG creation (the DMG
                                         # step needs Finder automation
                                         # permission for your terminal)
```

Note: `tauri:build` only produces packages for the OS it runs on — there is
no desktop cross-compilation.

#### Android

```sh
export ANDROID_KEYSTORE_PASSWORD='your-strong-password'
npm run android:keystore   # one-time: generates .signing/release.keystore
npm run android:build      # signed release APK + AAB
npm run android:dev        # run on a connected device/emulator
```

`npm run android:build` ([scripts/android-build.sh](scripts/android-build.sh))
does everything needed for a reproducible signed build:

1. Auto-detects `ANDROID_HOME`, the newest installed NDK, and a JDK ≥17
   ([scripts/android-env.sh](scripts/android-env.sh)) — no manual env vars
   required if the SDK/NDK/JDK are installed in their default locations.
2. Runs `tauri android init` if `src-tauri/gen/android` doesn't exist yet
   (that directory is gitignored/disposable, so this also self-heals after a
   fresh clone).
3. If `ANDROID_KEYSTORE_PASSWORD` is set and no keystore exists yet, generates
   one automatically via `npm run android:keystore`
   ([scripts/android-keystore.sh](scripts/android-keystore.sh)).
4. Idempotently injects a release `signingConfig` into the generated
   `build.gradle.kts` ([scripts/android-sign-inject.sh](scripts/android-sign-inject.sh))
   that reads `.signing/keystore.properties` — so signing survives the
   disposable `gen/android` directory being regenerated.
5. Builds. Without a keystore configured, the output is unsigned (same as
   plain `tauri android build`); with one, both the APK and AAB come out
   signed.

The keystore and `.signing/keystore.properties` are **gitignored** and never
committed — back them up somewhere safe (a password manager), since app
updates must always be signed with the same key. See
[keystore.properties.example](keystore.properties.example) for the file
format if you want to set it up manually instead of via
`npm run android:keystore`.

The Rust core uses `reqwest` with **rustls** (pure-Rust TLS) so it
cross-compiles for Android without an OpenSSL sysroot — keep this in mind
when adding HTTP-related dependencies.

#### GitHub login in native builds

Native builds use the **GitHub Device Flow** instead of the browser redirect:
the app displays a one-time code, the user confirms it at
`github.com/login/device`, and the app polls for the token. This requires no
client secret and no server — the packaged app is fully self-contained.

Setup:

1. In the GitHub OAuth App settings, check **"Enable Device Flow"**.
2. Set `GH_APP_CLIENT_ID` in `.env.local` **before building** — the value is
   baked into the bundle at build time (unlike Docker, there is no runtime
   injection; changing the OAuth app requires a rebuild).

The callback URL and client secret are **not used** by native builds. The
web deployments (dev server, Docker) are unaffected and keep the redirect
flow described above.

#### Documentation link in native builds

Desktop and Android builds have no same-origin docs server to fall back to
(unlike the web/Docker deployment, where the footer's **Docs** link resolves
to `<origin>/docs`). Set `VUE_APP_DOCS_URL` before running
`npm run build` / `tauri build` / `android:build` to point the link at hosted
docs instead:

```sh
export VUE_APP_DOCS_URL=https://cartographer-app.zenmem.de/docs/
```

The CI release workflow sets this automatically (see below); it only needs to
be set manually for local native builds.

### Release process (CI/CD)

[.github/workflows/release.yml](.github/workflows/release.yml) builds and
publishes installable packages for every platform:

* **Trigger:** push a version tag (`git tag v1.2.3 && git push origin v1.2.3`),
  or run it manually from the **Actions** tab (`workflow_dispatch`).
* **Desktop** (macOS universal, Windows, Linux): built via `tauri-action`,
  attached to a **draft** GitHub Release.
* **Android**: built and signed the same way as `npm run android:build`
  above, using repository secrets instead of a local keystore. Artifacts are
  attached to the same Release on tag pushes, or uploaded as downloadable
  **run artifacts** (no Release created) on manual runs — useful for testing
  the pipeline without publishing anything.
* **App version**: read from `package.json`'s `version` field
  (`src-tauri/tauri.conf.json`'s `version` points at `../package.json`), so
  bumping the release version only requires editing one file.

Required repository secrets for Android signing (**Settings → Secrets and
variables → Actions**):

| Secret | Description |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The release keystore, base64-encoded (`base64 -i .signing/release.keystore \| tr -d '\n'`). |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore (store) password. |
| `ANDROID_KEY_ALIAS` | Key alias (`upload` by default). |
| `ANDROID_KEY_PASSWORD` | Key password. |

Without these secrets, the Android job's fast keystore-verification step
fails immediately with a clear error instead of running a full build.

**macOS builds are currently unsigned** (no Apple Developer ID / notarization
configured). Downloaded `.dmg`/`.app` files trigger Gatekeeper's *"Apple could
not verify... is free of malware"* message — this is expected for any
unsigned app downloaded via a browser (which sets the quarantine attribute),
not a build defect. Workarounds: **System Settings → Privacy & Security →
Open Anyway**, or `xattr -cr Cartographer-App.app`. To remove this warning
permanently, `tauri-action` supports notarization via the `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, and `APPLE_TEAM_ID` secrets (requires a paid Apple Developer
Program membership) — not yet configured for this project.

### Docker Deployment

All configuration is injected at **runtime** via environment variables — the same image works for any subpath, host, or GitHub OAuth App.

#### 1. Build the image

```sh
docker build -t cartographer-app .
```

#### 2. Start the app

nginx serves the SPA **and** performs the GitHub OAuth token exchange
server-side (it injects the `client_secret`), so no separate auth container is
needed.

```sh
docker run -d \
  --name app1 \
  -e APP_PUBLIC_PATH=/demo \
  -e GH_APP_CLIENT_ID=<your-github-client-id> \
  -e GH_APP_CLIENT_SECRET=<your-github-client-secret> \
  -e GH_APP_CALL_BACK=http://localhost:8081/myAppPlaceholder/callback \
  -p 8081:80 \
  cartographer-app
```

Then open http://localhost:8081/demo.

#### Environment variables

| Variable | Description |
|---|---|
| `APP_PUBLIC_PATH` | Subpath the app is served under (e.g. `/demo`). Defaults to `/`. |
| `GH_APP_CLIENT_ID` | GitHub OAuth App client ID (public; safe in the browser). |
| `GH_APP_CALL_BACK` | OAuth callback URL. Use `/myAppPlaceholder/callback` and it will be rewritten to the actual subpath automatically. |
| `GH_APP_CLIENT_SECRET` | GitHub OAuth App client secret. Consumed only by nginx for the token exchange — never bundled into the SPA. |

#### GitHub OAuth App setup

In **GitHub → Settings → Developer settings → OAuth Apps**, configure the
callback URL that matches the deployment. For example:

```text
http://localhost:8081/demo/callback
```

For a root deployment, use `http://localhost:8081/callback`. For production,
use the corresponding HTTPS URL, such as
`https://myapp.example.org/demo/callback`. A GitHub OAuth App has one callback
URL setting, so deployments requiring different callback origins should use
separate OAuth Apps.

### Configuring the imprint and collaborators

The About dialog shows an imprint and a row of collaborator logos. By default
these are the ZenMEM / Paderborn University imprint and the ZenMEM and
NFDI4Culture logos. Institutions hosting their own instance can (and should)
replace them with their own details at runtime — no rebuild required:

```sh
docker run --rm -p 8080:80 \
  -e APP_PUBLIC_PATH=/demo \
  -e APP_IMPRINT_INSTITUTION='Some University, Institute for Music' \
  -e APP_IMPRINT_STREET='Musikweg 1' \
  -e APP_IMPRINT_ZIP='12345' \
  -e APP_IMPRINT_CITY='Musikstadt' \
  -e APP_IMPRINT_COUNTRY='Germany' \
  -e APP_IMPRINT_CONTACT_PERSON='Jane Doe' \
  -e APP_IMPRINT_EMAIL='info@example.org' \
  -e APP_IMPRINT_PHONE='+49 123 456789' \
  -e APP_IMPRINT_LINK='https://example.org/imprint' \
  -e APP_COLLABORATORS='[{"name":"Some University","logo":"https://example.org/logo.png","url":"https://example.org"},{"name":"ZenMEM","logo":"/demo/logos/zenmem_logo_de_einfarbig_ultrablau.png","url":"https://zenmem.de"}]' \
  cartographer-app
```

All imprint variables are optional and independent: set only the ones you need
(fields left unset are simply not displayed). If **none** of them is set, the
built-in default imprint is shown. `APP_IMPRINT_LINK` can also be used on its
own to point to an institution's existing imprint page.

`APP_COLLABORATORS` is a JSON array of objects with `name`, `logo`, and `url`.
Logo values must be URLs the browser can resolve: an absolute URL (e.g. hosted
on the institution's own website), or a path served by this container
**including the configured subpath** — e.g.
`/demo/logos/zenmem_logo_de_einfarbig_ultrablau.png` when running with
`APP_PUBLIC_PATH=/demo`, or `/logos/...` when running at the root path.
The built-in logos are available under `<subpath>/logos/` with their original
filenames. If `APP_COLLABORATORS` is not set, the default logos are shown; if
it is set but not valid JSON, a warning is logged in the browser console and
the default logos are shown.

#### Imprint and collaborator environment variables

`APP_PUBLIC_PATH` and the GitHub OAuth variables are described in the Docker
deployment table above. The following optional variables customize the About
dialog:

| Variable | Description |
|---|---|
| `APP_IMPRINT_INSTITUTION` | Institution name shown in the imprint. |
| `APP_IMPRINT_STREET` | Street and number. |
| `APP_IMPRINT_ZIP` | Postal code. |
| `APP_IMPRINT_CITY` | City. |
| `APP_IMPRINT_COUNTRY` | Country. |
| `APP_IMPRINT_CONTACT_PERSON` | Contact person's name. |
| `APP_IMPRINT_EMAIL` | Contact e-mail address (rendered as a mailto link). |
| `APP_IMPRINT_PHONE` | Phone number (rendered as a tel link). |
| `APP_IMPRINT_LINK` | URL of a full imprint page (rendered as "Full imprint" link). |
| `APP_COLLABORATORS` | Collaborator logos as a JSON array of `{"name", "logo", "url"}` objects. Defaults to the ZenMEM and NFDI4Culture logos. |