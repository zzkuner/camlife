import { Header } from '~/components/header'
import { Tabs } from '~/components/tabs'
import { View } from '~/components/view'

export default function HomePage() {
  return (
    <div className='flex flex-col items-center'>
      <Header />
      <Tabs />
      <View />
    </div>
  )
}
