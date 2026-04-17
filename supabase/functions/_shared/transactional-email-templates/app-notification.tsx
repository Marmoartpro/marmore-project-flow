import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'MármoreProArt'

interface AppNotificationProps {
  title?: string
  message?: string
  ctaUrl?: string
  ctaLabel?: string
  recipientName?: string
}

const AppNotificationEmail = ({
  title = 'Nova notificação',
  message = 'Você tem uma nova atualização no MármoreProArt.',
  ctaUrl,
  ctaLabel = 'Abrir aplicativo',
  recipientName,
}: AppNotificationProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>{title}</Heading>
          {recipientName && <Text style={greeting}>Olá, {recipientName}.</Text>}
          <Text style={text}>{message}</Text>
          {ctaUrl && (
            <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
              <Button href={ctaUrl} style={button}>{ctaLabel}</Button>
            </Section>
          )}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Você está recebendo este e-mail por ter atividade no {SITE_NAME}.
          Ajuste suas preferências em Configurações → Notificações.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AppNotificationEmail,
  subject: (data: Record<string, any>) => data?.title || 'Nova notificação',
  displayName: 'Notificação do app',
  previewData: {
    title: 'Etapa concluída',
    message: 'A etapa "Corte" foi concluída no projeto Cozinha Silva.',
    ctaUrl: 'https://marmoartpro.online/dashboard',
    ctaLabel: 'Ver projeto',
    recipientName: 'João',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 20px' }
const header = { textAlign: 'center' as const, padding: '8px 0 20px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', letterSpacing: '0.5px', margin: 0 }
const card = { backgroundColor: '#f7f7f8', borderRadius: '12px', padding: '28px 24px', border: '1px solid #e5e7eb' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 12px' }
const greeting = { fontSize: '14px', color: '#374151', margin: '0 0 8px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.55', margin: '0 0 8px' }
const button = { backgroundColor: '#1f2937', color: '#ffffff', borderRadius: '8px', padding: '12px 22px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e5e7eb', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const, margin: 0 }
