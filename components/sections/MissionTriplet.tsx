'use client';

import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { useI18n } from '../../components/i18n/LanguageProvider';
import { IoSchool } from "react-icons/io5";
import { FaHandshake } from "react-icons/fa";
import { FaBookQuran } from "react-icons/fa6";
import Link from 'next/link';

type Feature = {
  titleKey: keyof ReturnType<typeof useI18n>['t'];
  bodyKey: keyof ReturnType<typeof useI18n>['t'];
  icon: React.ReactElement;
};

function FeatureCard({ titleKey, bodyKey, icon }: Feature) {
  const { t } = useI18n();
  return (
    <div className="text-center px-4 flex flex-col items-center justify-center ">
      <div className="mx-auto mb-4 h-14 w-14 text-amber-700 text-center ">{icon}</div>
      <h3 className="text-3xl font-extrabold text-emerald-900 mb-3">{t(titleKey)}</h3>
      <p className="text-gray-700 leading-8">{t(bodyKey)}</p>
    </div>
  );
}

export default function MissionTriplet() {
  const { t } = useI18n();
  const features: ReadonlyArray<Feature> = [
    {
      titleKey: 'education' as keyof ReturnType<typeof useI18n>['t'],
      bodyKey: 'educationDesc' as keyof ReturnType<typeof useI18n>['t'],
      // icon: 
      icon : <IoSchool className='text-6xl'/>
    },
    {
      titleKey: 'service' as keyof ReturnType<typeof useI18n>['t'],
      bodyKey: 'serviceDesc' as keyof ReturnType<typeof useI18n>['t'],
      // icon: (
      //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 mx-auto">
      //     <path d="M7.5 8.25a2.25 2.25 0 1 1 3 2.122V15a.75.75 0 0 1-1.5 0v-1.5H7.5A2.25 2.25 0 0 1 7.5 8.25Zm9 0a2.25 2.25 0 1 0-3 2.122V15a.75.75 0 0 0 1.5 0v-1.5h1.5a2.25 2.25 0 0 0 0-4.5Z" />
      //   </svg>
      // ),
      icon: <FaHandshake className='text-6xl'/>
    },
    {
      titleKey: 'dawah' as keyof ReturnType<typeof useI18n>['t'],
      bodyKey: 'dawahDesc' as keyof ReturnType<typeof useI18n>['t'],
      // icon: (
      //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 mx-auto">
      //     <path d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h8.25A2.25 2.25 0 0 1 17.25 5.25v13.5A2.25 2.25 0 0 1 15 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25Z" />
      //     <path d="M18 6h.75A2.25 2.25 0 0 1 21 8.25v10.5A2.25 2.25 0 0 1 18.75 21H15a.75.75 0 0 1-.75-.75V6H18Z" />
      //   </svg>
      // ),
      icon: <FaBookQuran className='text-5xl'/>
    },
  ];

  return (
    <section className="pt-[550px] md:pt-[530px] lg:pt-[220px] pb-10">
      <Container>
        <h2 className="text-center text-4xl sm:text-5xl font-extrabold text-emerald-900 mb-20">{t('missionTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((f, idx) => (
            <FeatureCard key={idx} {...f} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/about">
            <Button className="px-6 py-3 text-base">{t('learnMore')}</Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}


