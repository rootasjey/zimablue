import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Footer } from '#components'

describe('Footer', () => {
  it('renders navigation links', async () => {
    const wrapper = await mountSuspended(Footer)
    const html = wrapper.html()
    expect(html).toContain('about')
    expect(html).toContain('contact me')
    expect(html).toContain('back to top')
  })

  it('renders copyright', async () => {
    const wrapper = await mountSuspended(Footer)
    expect(wrapper.text()).toContain('Jérémie Corpinot')
    expect(wrapper.text()).toContain(String(new Date().getFullYear()))
  })

  it('shows Back to home link when not on home page', async () => {
    const wrapper = await mountSuspended(Footer, { route: '/collections' })
    expect(wrapper.html()).toContain('Back to home')
  })

  it('hides Back to home link when on home page', async () => {
    const wrapper = await mountSuspended(Footer, { route: '/' })
    expect(wrapper.html()).not.toContain('Back to home')
  })

  it('renders the links slot', async () => {
    const wrapper = await mountSuspended(Footer, {
      slots: { links: '<a href="/admin" data-test="admin-link">Admin</a>' },
    })
    expect(wrapper.html()).toContain('Admin')
  })
})
