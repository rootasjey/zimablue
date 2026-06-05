import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { EmptySelectionState } from '#components'

describe('EmptySelectionState', () => {
  it('renders the message prop', async () => {
    const wrapper = await mountSuspended(EmptySelectionState, {
      props: { message: 'No images selected' },
    })
    expect(wrapper.html()).toContain('No images selected')
  })

  it('does not show action button by default', async () => {
    const wrapper = await mountSuspended(EmptySelectionState, {
      props: { message: 'Empty' },
    })
    expect(wrapper.html()).not.toContain('Take action')
  })

  it('shows action button when showAction is true', async () => {
    const wrapper = await mountSuspended(EmptySelectionState, {
      props: { message: 'Empty', showAction: true },
    })
    expect(wrapper.html()).toContain('Take action')
  })

  it('displays custom action text', async () => {
    const wrapper = await mountSuspended(EmptySelectionState, {
      props: { message: 'Empty', showAction: true, actionText: 'Go back' },
    })
    expect(wrapper.html()).toContain('Go back')
  })

  it('emits action event when button is clicked', async () => {
    const wrapper = await mountSuspended(EmptySelectionState, {
      props: { message: 'Empty', showAction: true },
    })
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')![0]).toEqual([])
  })
})
