'use client';

import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
// import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/Carousel';
import type { ActivityItem } from '../../components/activity/ActivityCard';
import { getLatestActivities } from '../../data/activities';
import { useI18n } from '../../components/i18n/LanguageProvider';
import { translateText } from '../../lib/translate';
// @ts-ignore - ensure to install `swiper` package in the project
import { Swiper, SwiperSlide } from 'swiper/react';
// @ts-ignore - ensure to install `swiper` package in the project
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import { getAllPrograms } from '../../services/programs';

function Card({ item }: { item: ActivityItem }): React.ReactElement {
  const { lang, t } = useI18n();
  const [translatedTitle, setTranslatedTitle] = useState(item.title);
  const [translatedDescription, setTranslatedDescription] = useState(item.description.slice(0,50));
  const [translatedTag, setTranslatedTag] = useState(item.tag || "নিয়মিত কার্যক্রম");
  const [isTranslating, setIsTranslating] = useState(false);

  const href = (item.href || `/activities/${item.id}`) as any;

  // Translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      // If the item already has a locale and it matches current language, use original
      if (item.locale && item.locale === lang) {
        setTranslatedTitle(item.title);
        setTranslatedDescription(item.description.slice(0,50));
        setTranslatedTag(item.tag || "নিয়মিত কার্যক্রম");
        return;
      }

      setIsTranslating(true);
      try {
        // Translate title, description, and tag in parallel
        const [titleResult, descriptionResult, tagResult] = await Promise.all([
          translateText(item.title, lang),
          translateText(item.description.slice(0,50), lang),
          translateText(item.tag || "নিয়মিত কার্যক্রম", lang),
        ]);

        setTranslatedTitle(titleResult);
        setTranslatedDescription(descriptionResult);
        setTranslatedTag(tagResult);
      } catch (error) {
        console.error('Failed to translate activity content:', error);
        // Fallback to original text on error
        setTranslatedTitle(item.title);
        setTranslatedDescription(item.description.slice(0,50));
        setTranslatedTag(item.tag || "নিয়মিত কার্যক্রম");
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [lang, item.title, item.description, item.tag, item.locale]);

  return (
    <div className="w-full h-full flex">
      <Link href={href} className="block bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group h-full flex flex-col">
        <div className="aspect-[16/10] w-full bg-gray-200 overflow-hidden">
       
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={translatedTitle} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
        <div className="mb-2 flex items-center gap-2 text-amber-600 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 2.5c-2.33 1.38-4.35 3.27-5.91 5.54l-2.27.65a2 2 0 0 0-1.38 1.38l-.65 2.27c-1.19 2.05-.29 4.66 1.99 5.45l.35.13c.36.13.77.04 1.04-.23l1.85-1.85 2.12 2.12-1.85 1.85c-.27.27-.36.68-.23 1.04l.13.35c.79 2.28 3.4 3.18 5.45 1.99l2.27-.65a2 2 0 0 0 1.38-1.38l.65-2.27c2.27-1.56 4.16-3.58 5.54-5.91.19-.32.14-.72-.12-.98l-7.07-7.07c-.26-.26-.66-.31-.98-.12ZM7.41 16.59l-1.3 1.3a.5.5 0 0 1-.54.11l-.35-.13a2.5 2.5 0 0 1-1.55-3.29l.13-.35a.5.5 0 0 1 .11-.19l1.3-1.3 2.2 2.2Zm6.18-8.66 4.48 4.48a20.9 20.9 0 0 1-3.45 3.45l-4.48-4.48a20.9 20.9 0 0 1 3.45-3.45Z"/>
          </svg>
          <span>
            {isTranslating ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">{item.tag || "নিয়মিত কার্যক্রম"}</span>
                <span className="text-xs">...</span>
              </span>
            ) : (
              translatedTag
            )}
          </span>
        </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-900 mb-1.5 sm:mb-2 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {isTranslating ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">{item.title}</span>
                <span className="text-xs text-gray-400">...</span>
              </span>
            ) : (
              translatedTitle
            )}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base leading-6 sm:leading-7 line-clamp-2 sm:line-clamp-2 flex-1">
            {isTranslating ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">{item.description.slice(0,50)}</span>
                <span className="text-xs text-gray-400">...</span>
              </span>
            ) : (
              translatedDescription
            )}
          </p>
          <div className="mt-3 sm:mt-4">
          <span className="inline-flex w-full justify-center items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-extrabold px-4 py-2.5 transition-colors">
            <span>{t('readMore')}</span>
          </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ActivityCarousel({ items }: { items?: ReadonlyArray<ActivityItem> }): React.ReactElement {
  const { t, lang } = useI18n();
  // Use provided items or get latest 3 activities from shared data
  const activities = items ? [...items] : getAllPrograms();
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);
  const carouselDir = lang === 'ar' ? 'rtl' : 'ltr';
  return (
    <section className="py-10 w-[360px]  sm:w-[420px] md:w-[1000px] lg:w-[1400px]  mx-auto " dir={carouselDir}>
      <Container className="w-full px-0 ">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-emerald-900">{t('activities')}</h2>
        </div>
        <div className="relative w-full ">
          {/* Custom navigation buttons */}
          <button
            ref={prevRef}
            aria-label="Previous"
            className="flex items-center justify-center absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white  shadow-sm ring-1 ring-gray-200 hover:bg-emerald-50 text-emerald-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M14.53 5.47a.75.75 0 0 1 0 1.06L9.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            ref={nextRef}
            aria-label="Next"
            className="flex items-center justify-center absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white  shadow-sm ring-1 ring-gray-200 hover:bg-emerald-50 text-emerald-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M9.47 18.53a.75.75 0 0 1 0-1.06L14.94 12 9.47 6.53a.75.75 0 0 1 1.06-1.06l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>

          <Swiper
            key={carouselDir}
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            loop={true}
            dir={carouselDir}
            onSwiper={(swiper: SwiperType) => {
              swiper.params.navigation = {
                ...(swiper.params.navigation as object),
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              };
              swiper.navigation.init();
              swiper.navigation.update();
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            autoplay={{ delay: 5000 }}
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-10 "
          >
            {Array.isArray(activities) ? activities.map((it) => (
              <SwiperSlide key={it.id}>
                <Card item={it} />
              </SwiperSlide>
            )) : null}
          </Swiper>
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/programs">
            <Button className="px-6">{t('readMore')}</Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}


