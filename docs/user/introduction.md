# Introduction

The **Cartographer App** provides placement information of zones of interest in (historical) documents.
The primary use case is the identification of bounding boxes of measures in music documents.

It is a successor of the [*Vertaktoid*](https://github.com/cemfi/vertaktoid). Unlike its predecessor, the Cartographer App is built on web technology and is platform-independent: through the [**Tauri**](https://tauri.app/) integration, the single web-based codebase is distributed as an installable native application for **Windows, macOS, Linux, and Android** — with no separate, platform-specific implementations to maintain. In addition, the app can be used directly in any modern **browser** without installation, or deployed as a containerized **web service** ([Docker](https://www.docker.com/)) hosted by an institution for its users.

It uses the [**Measure Detector**](https://github.com/cemfi/measure-detector) for automatic recognition of measure positions, while still allowing manual correction.

---

## Important Tools and Their Documentation

- **Vectre**: a VueJS version of Spectre CSS  
  [Vectre Documentation](https://vectrejs.github.io/docs/#/pages/getting-started)

- **OpenSeadragon**: a viewer for high-resolution zoomable images  
  [OpenSeadragon Site](http://openseadragon.github.io/)

- **Annotorious OpenSeadragon Plugin**: image annotation on top of OpenSeadragon  
  [Annotorious OSD Plugin](https://recogito.github.io/annotorious/getting-started/osd-plugin/)

- **Tauri**: a framework for packaging the web app as a native application  
  [Tauri Documentation](https://tauri.app/)
