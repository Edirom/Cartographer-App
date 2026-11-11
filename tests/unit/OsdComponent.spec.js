import OsdComponent from '@/components/OsdComponent.vue'

jest.mock('openseadragon', () => ({
  __esModule: true,
  default: {
    Rect: function (x, y, width, height) {
      Object.assign(this, { x, y, width, height })
    }
  }
}))
jest.mock('@recogito/annotorious-openseadragon', () => jest.fn())
jest.mock('@recogito/annotorious-openseadragon/dist/annotorious.min.css', () => ({}))

describe('OsdComponent zone coordinates', () => {
  function createContext () {
    return {
      ...OsdComponent.methods,
      viewer: {
        clearOverlays: jest.fn(),
        addOverlay: jest.fn(),
        world: { getItemAt: jest.fn() }
      },
      $store: {
        getters: {
          zonesOnCurrentPage: [{
            id: 'zone-1',
            target: { selector: { value: 'xywh=pixel:301,459,603,918' } },
            body: [
              { type: 'TextualBody', value: '1' },
              { type: 'Dataset', selector: { value: 'mov_0' } }
            ]
          }]
        },
        dispatch: jest.fn()
      },
      mdivColors: { mov_0: 'rgba(255, 87, 51, 0.2)' }
    }
  }

  function image (pixelWidth, viewportWidth) {
    return {
      imageToViewportRectangle: jest.fn((x, y, width, height) => {
        const scale = viewportWidth / pixelWidth
        return { x: x * scale, y: y * scale, width: width * scale, height: height * scale }
      })
    }
  }

  it.each([
    ['IIIF canvas dimensions differ from image pixels', 3015, 600],
    ['page dimensions are unknown', 3015, 1],
    ['page dimensions match image pixels', 3015, 3015]
  ])('aligns overlays when %s', (description, pixelWidth, viewportWidth) => {
    const context = createContext()
    const tiledImage = image(pixelWidth, viewportWidth)
    context.viewer.world.getItemAt.mockReturnValue(tiledImage)

    context.renderZones()

    expect(tiledImage.imageToViewportRectangle).toHaveBeenCalledWith(301, 459, 603, 918)
    const { element, location } = context.viewer.addOverlay.mock.calls[0][0]
    // Map the overlay back to image pixels, as the viewer does when displaying it.
    const pixelsPerViewportUnit = pixelWidth / viewportWidth
    expect(location.x * pixelsPerViewportUnit).toBeCloseTo(301)
    expect(location.y * pixelsPerViewportUnit).toBeCloseTo(459)
    expect(location.width * pixelsPerViewportUnit).toBeCloseTo(603)
    expect(location.height * pixelsPerViewportUnit).toBeCloseTo(918)
    expect(element.querySelector('.zoneLabel').textContent).toBe('1')
    element.click()
    expect(context.$store.dispatch).toHaveBeenCalledWith('clickZone', 'zone-1')
  })

  it('uses the newly loaded image dimensions after switching pages', () => {
    const context = createContext()
    const firstImage = image(3015, 600)
    const nextImage = image(4200, 600)
    context.viewer.world.getItemAt
      .mockReturnValueOnce(firstImage)
      .mockReturnValueOnce(nextImage)

    context.renderZones()
    context.renderZones()

    const overlays = context.viewer.addOverlay.mock.calls
    expect(overlays[0][0].location.width).toBeCloseTo(603 * 600 / 3015)
    expect(overlays[1][0].location.width).toBeCloseTo(603 * 600 / 4200)
  })

  it('clears stale overlays without rendering while no image is loaded', () => {
    const context = createContext()

    context.renderZones()

    expect(context.viewer.clearOverlays).toHaveBeenCalled()
    expect(context.viewer.addOverlay).not.toHaveBeenCalled()
  })
})
