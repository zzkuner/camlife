import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '~/components/theme-provider'
import { env } from '~/env'
import { type Locale, routing } from '~/i18n/routing'
import { cn } from '~/lib/utils'
import '~/styles/globals.css'
import { TRPCReactProvider } from '~/trpc/react'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

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

        {env.NODE_ENV !== 'development' && (
          <Script
            defer
            src='https://umami.guoqi.dev/script.js'
            data-website-id='e3df813a-bc42-4da9-af6d-664b0b56250d'
            data-domains='camlife.app'
          />
        )}
      </body>
    </html>
  )
}
