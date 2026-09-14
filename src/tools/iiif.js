import { uuid } from '@/tools/uuid.js'

/**
 * Normalizes a IIIF label into a single string. Presentation 2 uses a plain
 * string, while Presentation 3 uses a language map like { en: ['Page 1'] }.
 * @param {string|Object|Array} label - The raw IIIF label value.
 * @returns {string} - A single display string.
 */
function iiifLabel (label) {
  if (!label) return ''
  if (typeof label === 'string') return label
  if (Array.isArray(label)) return label[0] || ''
  const langs = Object.keys(label)
  if (langs.length === 0) return ''
  const value = label[langs[0]]
  return Array.isArray(value) ? (value[0] || '') : String(value)
}

/**
 * Resolves the image reference for a canvas across IIIF Presentation 2 and 3.
 * A canvas may point at a IIIF Image API service (base URI, tiled) or at a plain
 * static image (direct URL, no service).
 * @param {Object} canvas - The IIIF canvas object.
 * @param {boolean} hasItems - True for IIIF Presentation 3 (items), false for Presentation 2 (images).
 * @returns {{uri: string, isPlainImage: boolean, mimetype: string}}
 */
function resolveImage (canvas, hasItems) {
  if (hasItems === true) {
    // IIIF Presentation 3: canvas -> items[0].items[0].body
    const body = canvas?.items?.[0]?.items?.[0]?.body
    const service = body?.service
    if (Array.isArray(service) && service.length > 0) {
      return { uri: service[0].id || service[0]['@id'], isPlainImage: false, mimetype: '' }
    }
    if (service && (service.id || service['@id'])) {
      return { uri: service.id || service['@id'], isPlainImage: false, mimetype: '' }
    }
    // No image service: the body is a directly loadable image.
    return { uri: body?.id, isPlainImage: true, mimetype: body?.format || 'image/jpeg' }
  }

  // IIIF Presentation 2: canvas -> images[0].resource
  const resource = canvas?.images?.[0]?.resource
  const service = resource?.service
  if (service && (service['@id'] || service.id)) {
    return { uri: service['@id'] || service.id, isPlainImage: false, mimetype: '' }
  }
  // No image service: the resource is a directly loadable image.
  return { uri: resource?.['@id'] || resource?.id, isPlainImage: true, mimetype: resource?.format || 'image/jpeg' }
}

/**
 * Adds a page (surface) to the MEI file from a IIIF canvas.
 * @param {Object} canvas - The IIIF canvas object.
 * @param {number} n - Page number (1-based).
 * @param {Document} file - The MEI XML document to modify.
 * @param {Document} meiSurfaceTemplate - The MEI surface template XML.
 * @param {boolean} hasItems - True if IIIF Presentation 3 (items), false if Presentation 2 (images).
 */
function addPage(canvas, n, file, meiSurfaceTemplate, hasItems) {
  // Get the label and dimensions for the page directly from the canvas
  const label = iiifLabel(canvas.label)
  const width = canvas.width
  const height = canvas.height

  // Determine the image URI (IIIF Image service base or direct image URL)
  const { uri, isPlainImage, mimetype } = resolveImage(canvas, hasItems)

  // Generate unique IDs for surface and graphic
  const surfaceId = 's' + uuid()
  const graphicId = 'g' + uuid()

  // Clone the surface template and set attributes
  const surface = meiSurfaceTemplate.querySelector('surface').cloneNode(true)
  surface.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', surfaceId)
  surface.setAttribute('n', n)
  surface.setAttribute('label', label)
  surface.setAttribute('lrx', width)
  surface.setAttribute('lry', height)
  surface.removeAttribute('xmlns')

  // Set up the graphic element with image info
  const graphic = surface.querySelector('graphic')
  graphic.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', graphicId)
  graphic.setAttribute('target', uri)
  graphic.setAttribute('width', width)
  graphic.setAttribute('height', height)
  // A mimetype marks a directly loadable image (no IIIF Image service) so the
  // viewer loads it as a plain image instead of fetching a non-existent info.json.
  if (isPlainImage && uri) {
    graphic.setAttribute('mimetype', mimetype)
  }

  // Append the new surface to the facsimile section of the MEI file
  file.querySelector('facsimile').appendChild(surface)
}


/**
 * Converts a IIIF manifest JSON object into an MEI XML document.
 * - Loads MEI file and surface templates asynchronously.
 * - Sets up MEI metadata (title, source, date, etc.) from the IIIF manifest.
 * - Optionally fills in shelfmark and composer from IIIF metadata if available.
 * - Iterates over canvases (IIIF Presentation 2) or items (IIIF Presentation 3) and adds each as a surface/page using addPage().
 *
 * @param {Object} json - The IIIF manifest JSON.
 * @param {string} url - The manifest URL.
 * @param {DOMParser} parser - XML parser instance.
 * @returns {Promise<Document>} - Resolves to the generated MEI XML document.
 */
export async function iiifManifest2mei (json, url, parser) {
  const promises = []
  let meiFileTemplate
  let meiSurfaceTemplate
  promises.push(
    fetch('./assets/meiFileTemplate.xml')
      .then(res => res.text())
      .then(xml => { meiFileTemplate = parser.parseFromString(xml, 'application/xml') })
  )
  promises.push(
    fetch('./assets/meiSurfaceTemplate.xml')
      .then(res => res.text())
      .then(xml => { meiSurfaceTemplate = parser.parseFromString(xml, 'application/xml') })
  )

  return Promise.all(promises)
    .then(() => {
      const file = meiFileTemplate.querySelector('mei').cloneNode(true)

      const sourceId = 's' + uuid()
      // Set file id and metadata
      file.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', 'm' + uuid())
      file.querySelector('title').textContent = iiifLabel(json.label)
      file.querySelector('source').setAttribute('target', url)
      file.querySelector('source').setAttribute('xml:id', sourceId)
      file.querySelector('change date').setAttribute('isodate', new Date().toISOString().substring(0, 10))
      file.querySelector('changeDesc ptr').setAttribute('target', '#' + sourceId)

      // Try to extract shelfmark and composer from IIIF metadata
      try {   
        const metadata = json.metadata

        const shelfmark = metadata.find(entry => { return entry.label === 'Signatur' }).value
        file.querySelector('physLoc > identifier').textContent = shelfmark

        // const persistentIdentifier = metadata.find(entry => {entry.label = 'Persistente URL'}).value
        // file.querySelector('title').textContent = json.label

        const composer = metadata.find(entry => { return entry.label === 'Autor' }).value
        file.querySelector('composer persName').textContent = composer
      } catch (_) {}
      // Add each page as a surface. IIIF Presentation 2 exposes canvases under
      // sequences[0].canvases; Presentation 3 exposes them directly under items.
      if (Array.isArray(json.sequences) && json.sequences[0] && Array.isArray(json.sequences[0].canvases)) {
        json.sequences[0].canvases.forEach((canvas, i) => {
          addPage(canvas, i + 1, file, meiSurfaceTemplate, false)
        })
      } else if (Array.isArray(json.items)) {
        json.items.forEach((canvas, i) => {
          addPage(canvas, i + 1, file, meiSurfaceTemplate, true)
        })
      }
      return file
    })
}

/**
 * Checks if a given JSON object is a valid IIIF manifest (Presentation 2 or 3).
 * - Verifies the IIIF context, manifest type, presence of an ID, and sequences/items arrays.
 * - Returns true for IIIF Presentation 3 if items exist, otherwise checks for IIIF Presentation 2/3 with required fields.
 *
 * @param {Object} json - The IIIF manifest JSON object.
 * @returns {boolean} - True if the manifest is valid, false otherwise.
 */
export function checkIiifManifest (json) {
  const claimsIiif2 = json['@context'] === 'http://iiif.io/api/presentation/2/context.json'
  const claimsIiif3 = json['@context'] === 'http://iiif.io/api/presentation/3/context.json'
  const claimsManifest = json['@type'] === 'sc:Manifest'

  const hasId = typeof json['@id'] === 'string' && json['@id'].length > 0
  const hasSequences = Array.isArray(json.sequences)
  const hasItems = Array.isArray(json.items)

  if (hasItems == true) {
    return true
  } else {
    return (claimsIiif2 || claimsIiif3) && claimsManifest && hasId && (hasSequences || hasItems)
  }
}

/**
 * Extracts an array of page objects from an MEI XML document.
 * Each object contains metadata and properties for a single page/surface,
 * including image URI, MEI surface ID, page number, width, height, and flags for SVG and zones.
 *
 * @param {Document} mei - The MEI XML document.
 * @returns {Array} - Array of page objects for use in the application.
 */
export function getPageArray (mei) {
  const arr = []
  mei.querySelectorAll('surface').forEach((surface, n) => {
    const graphic = surface.querySelector('graphic')
    const obj = {}

    // Try multiple ways to get the target attribute
    let target = null
    if (graphic) {
      target = graphic.getAttribute('target') || 
               graphic.getAttributeNS('', 'target') ||
               graphic.getAttributeNS('http://www.music-encoding.org/ns/mei', 'target')
    }
    
    obj.uri = target ? target.trim() : null
    obj.id = surface.getAttribute('xml:id') ? surface.getAttribute('xml:id').trim() : null
    obj.n = surface.getAttribute('n') ? surface.getAttribute('n').trim() : null
    obj.label = surface.getAttribute('label') ? surface.getAttribute('label').trim() : null
    
    // Get width and height from graphic
    if (graphic) {
      const width = graphic.getAttribute('width') || graphic.getAttributeNS('', 'width')
      const height = graphic.getAttribute('height') || graphic.getAttributeNS('', 'height')
      obj.width = width ? parseInt(width.trim(), 10) : 0
      obj.height = height ? parseInt(height.trim(), 10) : 0
    }
    
    // Get width/height from surface as fallback
    if (!obj.width && surface.getAttribute('lrx')) {
      obj.width = parseInt(surface.getAttribute('lrx'), 10) - (parseInt(surface.getAttribute('ulx'), 10) || 0)
    }
    if (!obj.height && surface.getAttribute('lry')) {
      obj.height = parseInt(surface.getAttribute('lry'), 10) - (parseInt(surface.getAttribute('uly'), 10) || 0)
    }

    // A graphic with an image mimetype is a directly loadable image (no IIIF
    // Image service), so it must be shown as a plain image tile source rather
    // than by fetching an info.json.
    const mimetype = graphic ? (graphic.getAttribute('mimetype') || '') : ''
    obj.isPlainImage = mimetype.startsWith('image/')

    obj.hasSvg = surface.querySelector('svg') !== null // true if an SVG exists in this surface
    obj.hasZones = surface.querySelector('zone') !== null // true if any zone exists in this surface

    arr.push(obj)
  })
  return arr
}
