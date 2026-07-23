'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { useI18n } from '../../components/i18n/LanguageProvider';
import { translateText } from '../../lib/translate';
// import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/Carousel';
// @ts-ignore - ensure to install `swiper` package in the project
import { Swiper, SwiperSlide } from 'swiper/react';
// @ts-ignore - ensure to install `swiper` package in the project
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';

type Fund = {
  id: string;
  image: string;
  title: string;
  description: string;
  href?: string;
  locale?: "en" | "bn" | "ar";
};

function FundCard({ fund }: { fund: Fund }): React.ReactElement {
  const { lang, t } = useI18n();
  const [translatedTitle, setTranslatedTitle] = useState(fund.title);
  const [translatedDescription, setTranslatedDescription] = useState(fund.description.slice(0,80));
  const [isTranslating, setIsTranslating] = useState(false);

  // Translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      // If the fund already has a locale and it matches current language, use original
      if (fund.locale && fund.locale === lang) {
        setTranslatedTitle(fund.title);
        setTranslatedDescription(fund.description.slice(0,80));
        return;
      }

      setIsTranslating(true);
      try {
        // Translate title and description in parallel
        const [titleResult, descriptionResult] = await Promise.all([
          translateText(fund.title, lang),
          translateText(fund.description.slice(0,80), lang),
        ]);

        setTranslatedTitle(titleResult);
        setTranslatedDescription(descriptionResult);
      } catch (error) {
        console.error('Failed to translate donation fund content:', error);
        // Fallback to original text on error
        setTranslatedTitle(fund.title);
        setTranslatedDescription(fund.description.slice(0,80));
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [lang, fund.title, fund.description, fund.locale]);

  return (
    <div className="w-full h-full flex">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm h-full">
        <div className="aspect-[16/10] w-full bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fund.image} alt={translatedTitle} className="h-full w-full object-cover" />
        </div>
        <div className="p-3 sm:p-4 md:p-5">
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-emerald-900 mb-1.5 sm:mb-2 line-clamp-1">
            {isTranslating ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">{fund.title}</span>
                <span className="text-xs text-gray-400">...</span>
              </span>
            ) : (
              translatedTitle
            )}
          </h3>
          <p className="text-gray-700 text-sm sm:text-base leading-6 sm:leading-7 line-clamp-2 sm:line-clamp-2">
            {isTranslating ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-pulse">{fund.description.slice(0,80)}</span>
                <span className="text-xs text-gray-400">...</span>
              </span>
            ) : (
              translatedDescription + "..."
            )}
          </p>
          <div className="mt-3 sm:mt-4">
            <a href={fund.href} className="block w-full sm:w-auto">
              <Button className="w-full sm:w-full px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base">{t('donate')}</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const sampleFunds: ReadonlyArray<Fund> = [
  {
    id: 'skill',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1600&auto=format&fit=crop',
    title: 'দারুল কুরআন স্কিল ডেভেলপমেন্ট ইনস্টিটিউট',
    description: 'দক্ষতা উন্নয়ন ও কর্মমুখী প্রশিক্ষণে আগ্রহীদের জন্য অনুদান তহবিল।',
  },
  {
    id: 'winter',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop',
    title: 'শীতার্ত তহবিল',
    description: 'শীতে দরিদ্র মানুষের পাশে দাঁড়ানোর লক্ষ্য নিয়ে স্থায়ী তহবিল।',
  },
  {
    id: 'mosque',
    image: 'https://images.unsplash.com/photo-1591604466107-b7155a6a9c3e?q=80&w=1600&auto=format&fit=crop',
    title: 'মসজিদ কমপ্লেক্স ও ইসলামীক সেন্টার',
    description: 'ধর্মীয় ও সামাজিক কার্যক্রমের জন্য নির্মাণ সহায়তা তহবিল।',
  },
  {
    id: 'gferg',
    image: 'https://images.unsplash.com/photo-1591604466107-b7155a6a9c3e?q=80&w=1600&auto=format&fit=crop',
    title: 'মসজিদ কমপ্লেক্স ও ইসলামীক সেন্টার',
    description: 'ধর্মীয় ও সামাজিক কার্যক্রমের জন্য নির্মাণ সহায়তা তহবিল।',
  },
];

export default function DonationCarousel({ funds }: { funds: ReadonlyArray<Fund> }): React.ReactElement {
  const { t, lang } = useI18n();
  const prevRef = React.useRef<HTMLButtonElement | null>(null);
  const nextRef = React.useRef<HTMLButtonElement | null>(null);
  const carouselDir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <section className="py-10  w-[360px]  sm:w-[420px] md:w-[1000px] lg:w-[1400px]  mx-auto " dir={carouselDir}>
      <Container className="w-full px-0">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-emerald-900">{t('donationCategories')}</h2>
        </div>
        <div className="relative  w-full ">
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
            {funds.map((fund) => (
              <SwiperSlide key={fund.id}>
                <FundCard fund={fund} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="mt-8 flex justify-center">
          <a href="/donation">
            <Button className="px-6">{t('readMore')}</Button>
          </a>
        </div>
      </Container>
    </section>
  );
}


