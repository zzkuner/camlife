'use client'

import Image from 'next/image'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Loading } from '~/components/loading'
import { PhotoInfo } from '~/components/photo-info'
import { CardBody, CardContainer, CardItem } from '~/components/ui/3d-card'
import { useTab } from '~/store/useTab'
import { useView } from '~/store/useView'
import { api } from '~/trpc/react'
import type { Photo } from '~/types/photo'
import type { TabType } from '~/types/tabs'
import 'yet-another-react-lightbox/styles.css'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import NextJsImage from '~/components/nextjs-image'
import { cn } from '~/lib/utils'
import 'yet-another-react-lightbox/plugins/counter.css'

const getAdjustedDimensions = (width: number, height: number) =>
  height > width
    ? { width: Math.floor(800 * (width / height)), height: 800 }
    : { width, height }

const MemoizedPhotoInfo = memo(PhotoInfo)

const PhotoGallery = memo(
  ({
    photos,
    view,
    setIndex,
  }: {
    photos: Photo[]
    view: string
    setIndex: (index: number) => void
  }) => {
    const getContainerClassName = useCallback((view: string) => {
      switch (view) {
        case 'grid':
          return 'grid grid-cols-3 lg:grid-cols-4'
        case 'waterfall':
          return 'columns-2 gap-0 md:columns-3 md:gap-6 xl:columns-4'
        case 'feed':
          return 'flex flex-col items-center'
      }
    }, [])

    return (
      <div className={cn(getContainerClassName(view), 'container')}>
        {photos.map((photo, index) => {
          const { width, height } = getAdjustedDimensions(
            photo.width,
            photo.height,
          )

          if (view === 'waterfall')
            return (
              <CardContainer
                containerClassName='py-0 md:mb-6'
                key={photo.uuid}
              >
                <CardBody className='h-auto w-auto'>
                  <CardItem
                    translateZ='50'
                    className='cursor-pointer'
                    onClick={() => setIndex(index)}
                  >
                    <ImageItem
                      width={width}
                      height={height}
                      src={photo.url}
                      bluerData={photo.blurData ?? ''}
                      view={view}
                    />
                  </CardItem>
                </CardBody>
              </CardContainer>
            )

          return (
            <div
              key={photo.uuid}
              className='flex flex-col items-center'
            >
              <div
                onClick={() => setIndex(index)}
                className='cursor-pointer'
              >
                <ImageItem
                  width={width}
                  height={height}
                  src={photo.url}
                  bluerData={photo.blurData ?? ''}
                  view={view}
                />
              </div>
              {view === 'feed' && <MemoizedPhotoInfo {...photo} />}
            </div>
          )
        })}
      </div>
    )
  },
)

const PhotoLightbox = memo(
  ({
    index,
    slides,
    onClose,
    photos,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  }: {
    index: number
    slides: Array<{ src: string; width: number; height: number }>
    onClose: () => void
    photos: Photo[]
    hasNextPage: boolean
    isFetchingNextPage: boolean
    fetchNextPage: () => void
  }) => {
    const handleView = useCallback(
      ({ index: currentIndex }: { index: number }) => {
        if (
          currentIndex >= photos.length - 5 &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage()
        }
      },
      [photos.length, hasNextPage, isFetchingNextPage, fetchNextPage],
    )

    return (
      <Lightbox
        render={{
          slide: (props) => <NextJsImage {...props} />,
        }}
        index={index}
        slides={slides}
        open={index >= 0}
        close={onClose}
        plugins={[Zoom, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
        on={{ view: handleView }}
      />
    )
  },
)

const ImageItem = ({
  src,
  width,
  height,
  bluerData,
  view,
}: {
  src: string
  width: number
  height: number
  bluerData: string
  view: string
}) => (
  <Image
    alt=''
    src={src}
    width={width}
    height={height}
    placeholder='blur'
    blurDataURL={bluerData ?? ''}
    loading='lazy'
    className={cn({
      'h-[100px] object-cover transition-transform duration-300 ease-in-out hover:scale-105 md:h-[200px]':
        view === 'grid',
      'hover:shadow-xl md:rounded-xl': view === 'waterfall',
      'xl:rounded-xl xl:shadow-outline xl:shadow-xl': view === 'feed',
    })}
    style={view === 'grid' ? { objectFit: 'cover' as const } : undefined}
  />
)

export function View() {
  const { view } = useView()
  const { tab } = useTab() as { tab: TabType }
  const [userLocation, setUserLocation] =
    useState<GeolocationCoordinates | null>(null)
  const [locationStatus, setLocationStatus] = useState<
    'pending' | 'granted' | 'denied' | null
  >(null)
  const { ref, inView } = useInView()
  const [index, setIndex] = useState(-1)

  const getLocation = useCallback(() => {
    if (tab !== 'nearby' && tab !== 'faraway') return

    setLocationStatus('pending')
    if (!('geolocation' in navigator)) {
      console.error('This browser does not support geolocation')
      setLocationStatus('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(position.coords)
        setLocationStatus('granted')
      },
      (error) => {
        console.error('Failed to get geolocation:', error.message)
        setLocationStatus('denied')
      },
    )
  }, [tab])

  useEffect(() => {
    getLocation()
  }, [getLocation])

  const getLimitByView = useCallback((view: string) => {
    const limits: Record<string, number> = { grid: 20, waterfall: 10, feed: 5 }
    return limits[view] ?? 10
  }, [])

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    api.photos.getAllPhotos.useInfiniteQuery(
      {
        tab,
        ...((tab === 'nearby' || tab === 'faraway') &&
          userLocation && {
            location: `${userLocation.latitude},${userLocation.longitude}`,
          }),
        limit: getLimitByView(view),
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
        staleTime: tab === 'shuffle' ? 0 : 5 * 60 * 1000,
        enabled:
          (tab !== 'nearby' && tab !== 'faraway') ||
          locationStatus === 'granted',
      },
    )

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const photos = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )

  const isLoadingOrFetching =
    isLoading ||
    (isFetchingNextPage && tab === 'shuffle') ||
    locationStatus === 'pending'

  const slides = useMemo(
    () =>
      photos?.map(({ url, width, height }) => ({ src: url, width, height })) ??
      [],
    [photos],
  )

  if (isLoadingOrFetching) {
    return (
      <div className='flex h-[60vh] w-full items-center justify-center'>
        <Loading />
      </div>
    )
  }

  if ((tab === 'nearby' || tab === 'faraway') && locationStatus === 'denied') {
    return (
      <div className='flex h-[60vh] w-full items-center justify-center'>
        <p>Location access denied. Unable to display relevant photos.</p>
      </div>
    )
  }

  if (!photos || photos.length === 0) {
    return (
      <div className='flex h-[60vh] w-full items-center justify-center'>
        <p>No photos found.</p>
      </div>
    )
  }

  return (
    <>
      <PhotoGallery
        photos={photos as Photo[]}
        view={view}
        setIndex={setIndex}
      />

      <PhotoLightbox
        index={index}
        slides={slides}
        onClose={() => setIndex(-1)}
        photos={photos as Photo[]}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />

      {isFetchingNextPage && (
        <div
          className={cn(
            'mb-5 flex justify-center',
            view !== 'feed' && 'mt-5 md:mt-10',
          )}
        >
          <Loading />
        </div>
      )}

      <div
        ref={ref}
        className='h-20 w-full'
        aria-hidden='true'
      />
    </>
  )
}
