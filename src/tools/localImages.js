/**
 * Helper functions for handling local image imports
 */

import UTIF from 'utif'

/**
 * Convert local image files to OpenSeadragon-compatible format.
 * @param {File[]} imageFiles - Array of image File objects
 * @returns {Promise<Array>} - Promise resolving to an array of page objects
 */
export async function convertLocalImagesToPages(imageFiles) {
  const pagePromises = imageFiles.map(async (file, index) => {
    const extension = file.name.substring(file.name.lastIndexOf('.')) || '.jpg'
    const imageName = `image${index + 1}${extension}`
    const originalPath = file.webkitRelativePath || file.name

    let width = 0
    let height = 0
    let imageUrl

    try {
      const bitmap = await createImageBitmap(file)
      width = bitmap.width
      height = bitmap.height
      bitmap.close()
      imageUrl = URL.createObjectURL(file)
    } catch {
      // createImageBitmap failed — check for TIFF container with embedded JPEG.
      const buffer = await file.arrayBuffer()
      const magic  = new Uint8Array(buffer, 0, 4)
      const isTiff = (magic[0] === 0x49 && magic[1] === 0x49 && magic[2] === 0x2A && magic[3] === 0x00) ||
                     (magic[0] === 0x4D && magic[1] === 0x4D && magic[2] === 0x00 && magic[3] === 0x2A)

      if (isTiff) {
        // TIFF container — use UTIF only to read metadata (strip offsets/lengths),
        // then extract the embedded JPEG bytes and decode with the browser's native decoder.
        // This avoids UTIF's broken JS JPEG decoder which mis-renders color.
        try {
          const ifds = UTIF.decode(buffer)
          // Pick largest IFD (avoids thumbnails)
          let ifd = ifds[0]
          for (const i of ifds) {
            if ((i['t256']?.[0]||0)*(i['t257']?.[0]||0) > (ifd['t256']?.[0]||0)*(ifd['t257']?.[0]||0)) ifd = i
          }
          const w = ifd['t256']?.[0] || ifd.width
          const h = ifd['t257']?.[0] || ifd.height
          const compression = ifd['t259']?.[0]

          if (compression === 7 || compression === 6) {
            // JPEG-in-TIFF: extract the strip bytes then combine with JPEGTables
            // if present (t347). Many TIFF encoders store DQT/DHT tables in the
            // JPEGTables tag and omit them from the strip, making the strip alone
            // an invalid JPEG that browsers reject with InvalidStateError.
            const offsets   = ifd['t273'] || ifd['t324'] || []
            const lengths   = ifd['t279'] || ifd['t325'] || []
            const rawBytes  = new Uint8Array(buffer)
            const parts     = offsets.map((off, i) => rawBytes.slice(off, off + lengths[i]))
            const totalLen  = parts.reduce((s, p) => s + p.byteLength, 0)
            const combined  = new Uint8Array(totalLen)
            let pos = 0
            for (const p of parts) { combined.set(p, pos); pos += p.byteLength }

            // If JPEGTables (t347) is present, inject those table markers
            // (DQT, DHT, etc.) right after the strip's SOI so the browser
            // gets a fully self-contained JPEG stream.
            const jpegTables = ifd['t347']
            let jpegData = combined
            if (jpegTables && jpegTables.length > 4) {
              // JPEGTables: SOI(ff d8) + [DQT/DHT/...] + optional EOI(ff d9)
              const tblStart = (jpegTables[0] === 0xFF && jpegTables[1] === 0xD8) ? 2 : 0
              const tblEnd   = (jpegTables[jpegTables.length - 2] === 0xFF &&
                                jpegTables[jpegTables.length - 1] === 0xD9)
                               ? jpegTables.length - 2 : jpegTables.length
              const tblBody  = jpegTables.slice(tblStart, tblEnd)
              // Strip's SOI is the first 2 bytes; everything after is the frame
              const stripFrame = (combined[0] === 0xFF && combined[1] === 0xD8)
                                 ? combined.slice(2) : combined
              jpegData = new Uint8Array(2 + tblBody.length + stripFrame.length)
              jpegData[0] = 0xFF; jpegData[1] = 0xD8   // SOI
              jpegData.set(tblBody,  2)
              jpegData.set(stripFrame, 2 + tblBody.length)
            }

            const jpegBlob  = new Blob([jpegData], { type: 'image/jpeg' })
            const bitmap    = await createImageBitmap(jpegBlob)
            const canvas    = document.createElement('canvas')
            canvas.width    = bitmap.width
            canvas.height   = bitmap.height
            canvas.getContext('2d').drawImage(bitmap, 0, 0)
            bitmap.close()
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            width    = canvas.width
            height   = canvas.height
            imageUrl = URL.createObjectURL(blob)
          } else {
            // Non-JPEG TIFF (uncompressed, LZW, etc.) — use UTIF pixel decoder
            UTIF.decodeImage(buffer, ifd)
            const raw  = UTIF.toRGBA8(ifd)
            const rgba = new Uint8ClampedArray(raw)
            const canvas = document.createElement('canvas')
            canvas.width  = w
            canvas.height = h
            canvas.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            width    = w
            height   = h
            imageUrl = URL.createObjectURL(blob)
          }
        } catch (err) {
          console.warn(`⚠️ TIFF decode failed for ${file.name}:`, err)
        }
      }
    }

    const blobUrl = URL.createObjectURL(file)

    return {
      type: 'image',
      url: imageUrl,
      uri: originalPath,
      imageUrl,
      width,
      height,
      n: (index + 1).toString(),
      label: imageName,
      fileName: file.name,
      imageName,
      filePath: originalPath,
      isLocalImage: true,
      hasSvg: false,
      hasZones: false,
      _file: file,
      _blobUrl: blobUrl
    }
  })

  const pages = await Promise.all(pagePromises)
  return pages
}

/**
 * Sort image files by name (natural sort for numbered files)
 * @param {File[]} files - Array of File objects
 * @returns {File[]} - Sorted array of files
 */
export function sortImageFiles(files) {
  return files.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  })
}

/**
 * Filter array to only include valid image files
 * @param {File[]} files - Array of File objects
 * @returns {File[]} - Filtered array containing only image files
 */
export function filterImageFiles(files) {
  return files.filter(file => {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(file.name)
  })
}

/**
 * Get the folder path from a File object
 * @param {File} file - File object with webkitRelativePath
 * @returns {string} - Folder path
 */
export function getFolderPath(file) {
  if (file.webkitRelativePath) {
    const parts = file.webkitRelativePath.split('/')
    parts.pop() // Remove filename
    return parts.join('/')
  }
  return ''
}
