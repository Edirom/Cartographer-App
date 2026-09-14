import { shallowMount } from '@vue/test-utils'
import PagesListEntry from '@/components/PagesListEntry.vue'

describe('PagesListEntry', () => {
  const page = {
    n: 3,
    label: 'Page 3',
    tileSource: 'https://example.org/iiif/page-3',
    dim: '1200 × 1800'
  }

  function mountEntry (pageOverrides = {}) {
    const store = { dispatch: jest.fn() }
    const wrapper = shallowMount(PagesListEntry, {
      props: {
        page: { ...page, ...pageOverrides },
        index: 2
      },
      global: {
        mocks: { $store: store }
      }
    })

    return { store, wrapper }
  }

  it('renders the page metadata and IIIF thumbnail URL', () => {
    const { wrapper } = mountEntry()

    expect(wrapper.get('.pn').text()).toBe('3')
    expect(wrapper.get('.uri').text()).toBe(page.tileSource)
    expect(wrapper.get('.dim').text()).toBe(page.dim)
    expect(wrapper.get('img').attributes('src')).toBe(
      `${page.tileSource}/full/,45/0/default.jpg`
    )
  })

  it('uses an object tile source URL directly', () => {
    const url = 'https://example.org/iiif/page-3/info.json'
    const { wrapper } = mountEntry({ tileSource: { url } })

    expect(wrapper.get('.uri').text()).toBe(url)
    expect(wrapper.get('img').attributes('src')).toBe(url)
  })

  it('dispatches the updated page label', async () => {
    const { store, wrapper } = mountEntry()

    await wrapper.get('input').setValue('Front cover')

    expect(store.dispatch).toHaveBeenCalledWith('setPageLabel', {
      index: 2,
      val: 'Front cover'
    })
  })

  it('opens the selected page when its thumbnail is clicked', async () => {
    const { store, wrapper } = mountEntry()

    await wrapper.get('img').trigger('click')

    expect(store.dispatch.mock.calls).toEqual([
      ['togglePagesModal'],
      ['setCurrentPage', 2]
    ])
  })
})
