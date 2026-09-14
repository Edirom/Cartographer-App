# Tools Directory

This directory contains helper functions that support core features of the Cartographer App.

## Overview

The files in this directory provide helper functions for:

- **MEI Mapping** (`meiMappings.js`)
- **IIIF Mapping** (`iiif.js`)
- **Local Images** (`localImages.js`) — converts local image files into
  OpenSeadragon-compatible page objects and sorts them by filename. Handles TIFF
  containers, including TIFFs whose pixel data is stored as an embedded JPEG (it
  extracts the JPEG bytes and, when needed, injects the missing DQT/DHT tables
  from the `JPEGTables` tag so the browser can decode the image).
- **UUID** (`uuid.js`) — generates RFC 4122 version 4 identifiers used for MEI
  element `xml:id`s.
