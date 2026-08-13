import type { H3Event } from 'h3'

interface EmailMessage {
  to: string
  from: { email: string; name?: string }
  replyTo?: string
  subject: string
  html: string
  text: string
}

interface EmailBinding {
  send(message: EmailMessage): Promise<unknown>
}

interface CloudflareContext {
  cloudflare?: { env?: { EMAIL?: EmailBinding } }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

export interface SendEmailOptions {
  to: string
  replyTo?: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(event: H3Event, options: SendEmailOptions): Promise<'sent' | 'dev-fallback'> {
  const config = useRuntimeConfig(event)
  const emailConfig = config.email as { from?: string; fromName?: string } | undefined
  const binding = (event.context as CloudflareContext).cloudflare?.env?.EMAIL
    || (process.env as Record<string, unknown>).EMAIL as EmailBinding | undefined
    || (globalThis as typeof globalThis & { EMAIL?: EmailBinding }).EMAIL

  if (!binding) {
    if (import.meta.dev) {
      console.info(`[email:dev] ${options.subject} -> ${options.to}\n${options.text}`)
      return 'dev-fallback'
    }
    throw new Error('Cloudflare Email Sending binding is not available')
  }

  await binding.send({
    to: options.to,
    from: { email: emailConfig?.from || 'no-reply@zimablue.cc', name: emailConfig?.fromName || 'Zima Blue' },
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    subject: options.subject,
    html: options.html || `<p>${escapeHtml(options.text).replace(/\n/g, '<br>')}</p>`,
    text: options.text,
  })
  return 'sent'
}

export function emailHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
}

export function getSiteUrl(event: H3Event): string {
  const config = useRuntimeConfig(event)
  return String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
}

export function getContactRecipient(event: H3Event): string {
  const config = useRuntimeConfig(event)
  return String((config.email as { contactRecipient?: string } | undefined)?.contactRecipient || '')
}
