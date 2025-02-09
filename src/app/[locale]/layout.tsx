import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '~/components/analytics'
import { ThemeProvider } from '~/components/theme-provider'
import { type Locale, routing } from '~/i18n/routing'
import { cn } from '~/lib/utils'
import { TRPCReactProvider } from '~/trpc/react'

import '~/styles/globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CamLife',
  description: 'Capture Life through the Camera.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const messages = await getMessages()

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
    >
      <body className={cn(geist.variable, geist.className)}>
        <NextIntlClientProvider messages={messages}>
          <TRPCReactProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>

        <Analytics />
      </body>
    </html>
  )
}
