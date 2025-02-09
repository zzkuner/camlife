import Script from 'next/script'
import { env } from '~/env'

export function Analytics() {
  if (env.NODE_ENV === 'development') {
    return null
  }

  return (
    <Script
      defer
      src='https://umami.guoqi.dev/script.js'
      data-website-id='3c588e5c-ccd9-4d71-9dec-11908443ca14'
      data-domains='camlife.app'
    />
  )
}
