import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { EmptyState } from '#components'

describe('EmptyState', () => {
  it('renders default collection variant', async () => {
    const wrapper = await mountSuspended(EmptyState)
    expect(wrapper.text()).toContain('nothing here yet')
    expect(wrapper.text()).toContain('There are no images in this collection yet.')
  })

  it('renders gallery variant', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { variant: 'gallery' },
    })
    expect(wrapper.text()).toContain('no images found')
    expect(wrapper.text()).toContain('Upload some images')
  })

  it('renders search variant', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { variant: 'search' },
    })
    expect(wrapper.text()).toContain('no results found')
    expect(wrapper.text()).toContain('Try adjusting your search terms')
  })

  it('uses custom heading and description when provided', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { heading: 'Custom Title', description: 'Custom description text' },
    })
    expect(wrapper.text()).toContain('Custom Title')
    expect(wrapper.text()).toContain('Custom description text')
  })

  it('shows action button with default variant text', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { showAction: true },
    })
    const html = wrapper.html()
    expect(html).toContain('Add images from gallery')
  })

  it('shows custom action text', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { showAction: true, actionText: 'Go back', variant: 'search' },
    })
    expect(wrapper.html()).toContain('Go back')
  })

  it('emits action on button click', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      props: { showAction: true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('renders actions slot content', async () => {
    const wrapper = await mountSuspended(EmptyState, {
      slots: { actions: '<div data-test="custom-actions">Extra content</div>' },
    })
    expect(wrapper.html()).toContain('Extra content')
  })
})
