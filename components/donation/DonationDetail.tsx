'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Container from '../../components/layout/Container';
import Button from '../../components/ui/Button';
import { useI18n, Lang } from '../../components/i18n/LanguageProvider';
import { translateText } from '../../lib/translate';
import {
  DonationCachePayload,
  storeDonationPayload,
} from '../../lib/donationPayment';
import config from '../../config';

export type DonationDetailData = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  videoUrl?: string;
  expenditureCategories?: string[];
  // Right widget
  formTitle?: string;
  formDescription?: string;
  // Amount presets
  amount?: number[] | null;
  daily?: number[] | null;
  monthly?: number[] | null;
  locale?: "en" | "bn" | "ar";
};

type Props = {
  data: DonationDetailData;
};

function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function DonationDetail({ data }: Props): React.ReactElement {
  const { lang, t } = useI18n();
  const [translatedTitle, setTranslatedTitle] = useState(data.title);
  const [translatedSubtitle, setTranslatedSubtitle] = useState(data.subtitle || '');
  const [translatedDescription, setTranslatedDescription] = useState(data.description || '');
  const [translatedFormTitle, setTranslatedFormTitle] = useState(data.formTitle || '');
  const [translatedFormDescription, setTranslatedFormDescription] = useState(data.formDescription || '');
  const [translatedCategories, setTranslatedCategories] = useState<string[]>(data.expenditureCategories || []);
  const [isTranslating, setIsTranslating] = useState(false);

  // Form state
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [behalf, setBehalf] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'bank_transfer' | 'bank_deposit'>('online');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoId = getYouTubeVideoId(data.videoUrl);

  // Translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      // If the data already has a locale and it matches current language, use original
      if (data.locale && data.locale === lang) {
        setTranslatedTitle(data.title);
        setTranslatedSubtitle(data.subtitle || '');
        setTranslatedDescription(data.description || '');
        setTranslatedFormTitle(data.formTitle || '');
        setTranslatedFormDescription(data.formDescription || '');
        setTranslatedCategories(data.expenditureCategories || []);
        return;
      }

      setIsTranslating(true);
      try {
        // Prepare all translation promises
        const promises: Promise<string>[] = [
          translateText(data.title, lang),
        ];

        if (data.subtitle) {
          promises.push(translateText(data.subtitle, lang));
        }

        if (data.description) {
          promises.push(translateText(data.description, lang));
        }

        if (data.formTitle) {
          promises.push(translateText(data.formTitle, lang));
        }

        if (data.formDescription) {
          promises.push(translateText(data.formDescription, lang));
        }

        // Translate categories if they exist
        if (data.expenditureCategories && data.expenditureCategories.length > 0) {
          promises.push(...data.expenditureCategories.map(cat => translateText(cat, lang)));
        }

        // Execute all translations in parallel
        const results = await Promise.all(promises);
        
        let index = 0;
        setTranslatedTitle(results[index++]);
        
        if (data.subtitle) {
          setTranslatedSubtitle(results[index++] || '');
        }
        
        if (data.description) {
          setTranslatedDescription(results[index++] || '');
        }
        
        if (data.formTitle) {
          setTranslatedFormTitle(results[index++] || '');
        }
        
        if (data.formDescription) {
          setTranslatedFormDescription(results[index++] || '');
        }
        
        if (data.expenditureCategories && data.expenditureCategories.length > 0) {
          const categoryTranslations = results.slice(index);
          setTranslatedCategories(categoryTranslations);
        }
      } catch (error) {
        console.error('Failed to translate donation detail content:', error);
        // Fallback to original text on error
        setTranslatedTitle(data.title);
        setTranslatedSubtitle(data.subtitle || '');
        setTranslatedDescription(data.description || '');
        setTranslatedFormTitle(data.formTitle || '');
        setTranslatedFormDescription(data.formDescription || '');
        setTranslatedCategories(data.expenditureCategories || []);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [lang, data.title, data.subtitle, data.description, data.formTitle, data.formDescription, data.expenditureCategories, data.locale]);

//   const hasFlatPresets = Array.isArray(data.amount) && (data.amount?.length ?? 0) > 0;
//   const hasDaily = Array.isArray(data.daily) && (data.daily?.length ?? 0) > 0;
//   const hasMonthly = Array.isArray(data.monthly) && (data.monthly?.length ?? 0) > 0;

//   const initialTab: 'daily' | 'monthly' = hasDaily ? 'daily' : 'monthly';
//   const [tab, setTab] = React.useState<'daily' | 'monthly'>(initialTab);
//   const [selectedPreset, setSelectedPreset] = React.useState<number | null>(
//     hasFlatPresets ? data.amount![0]! : hasDaily ? data.daily![0]! : hasMonthly ? data.monthly![0]! : null
//   );
//   const [customAmount, setCustomAmount] = React.useState<string>(selectedPreset ? String(selectedPreset) : '');

//   const formatBn = (n: number) => n.toLocaleString('bn-BD');

//   React.useEffect(() => {
//     setCustomAmount(selectedPreset != null ? String(selectedPreset) : '');
//   }, [selectedPreset]);

//   // When switching tabs (daily/monthly), pick first available preset for that tab
//   React.useEffect(() => {
//     if (hasFlatPresets) return;
//     const presets = tab === 'daily' ? (data.daily || []) : (data.monthly || []);
//     if (presets.length > 0) {
//       setSelectedPreset(presets[0]!);
//       // keep the input blank for disabled state to avoid visual mixing
//       setCustomAmount('');
//     } else {
//       setSelectedPreset(null);
//       setCustomAmount('');
//     }
//   }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

//   const activePresets = hasFlatPresets
//     ? data.amount!
//     : tab === 'daily'
//     ? (data.daily || [])
//     : (data.monthly || []);

const hasFlatPresets = Array.isArray(data.amount) && (data.amount?.length ?? 0) > 0;
const hasDaily = Array.isArray(data.daily) && (data.daily?.length ?? 0) > 0;
const hasMonthly = Array.isArray(data.monthly) && (data.monthly?.length ?? 0) > 0;

const initialTab: 'daily' | 'monthly' = hasDaily ? 'daily' : 'monthly';
const [tab, setTab] = React.useState<'daily' | 'monthly'>(initialTab);

const [selectedPreset, setSelectedPreset] = React.useState<number | null>(
  hasFlatPresets
    ? data.amount![0]!
    : hasDaily
    ? data.daily![0]!
    : hasMonthly
    ? data.monthly![0]!
    : null
);

const [customAmount, setCustomAmount] = React.useState<string>(
  selectedPreset ? String(selectedPreset) : ''
);

const formatNumber = (n: number, locale: Lang) => {
  const localeMap: Record<Lang, string> = {
    bn: 'bn-BD',
    en: 'en-US',
    ar: 'ar-SA',
  };
  return n.toLocaleString(localeMap[locale]);
};

// Sync preset → input ONLY for flat presets
React.useEffect(() => {
  if (hasFlatPresets) {
    setCustomAmount(selectedPreset != null ? String(selectedPreset) : '');
  }
}, [selectedPreset, hasFlatPresets]);

// Handle tab switching (daily/monthly)
React.useEffect(() => {
  if (hasFlatPresets) return;

  const presets = tab === 'daily' ? (data.daily || []) : (data.monthly || []);

  if (presets.length > 0) {
    setSelectedPreset(presets[0]!);
  } else {
    setSelectedPreset(null);
  }

  setCustomAmount(''); // reset input on switching tab
}, [tab, hasFlatPresets]); // eslint-disable-line react-hooks/exhaustive-deps

const activePresets = hasFlatPresets
  ? data.amount!
  : tab === 'daily'
  ? (data.daily || [])
  : (data.monthly || []);

  // Parse amount from input (remove currency symbols, commas, and spaces)
  const parseAmount = (value: string): number => {
    const cleaned = value.replace(/[৳,\s]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Get current amount value
  const getCurrentAmount = (): number => {
    if (selectedPreset !== null) {
      return selectedPreset;
    }
    return parseAmount(customAmount);
  };

  // Validate contact field: either 7-14 digits or valid email
  const validateContact = React.useCallback((contactValue: string): string | null => {
    if (!contactValue) {
      return t('contactError');
    }

    const trimmedContact = contactValue.trim();
    
    // Check if all characters are digits
    const isAllDigits = /^\d+$/.test(trimmedContact);
    
    if (isAllDigits) {
      // If all digits, check length (7-14)
      if (trimmedContact.length >= 7 && trimmedContact.length <= 14) {
        return null; // Valid phone number
      } else {
        return t('contactNumberLengthError');
      }
    } else {
      // If not all digits, validate as email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedContact)) {
        return null; // Valid email
      } else {
        return t('contactInvalidFormatError');
      }
    }
  }, [t]);

  // Form validation errors
  const contactError = submitted ? validateContact(contact) : null;
  const amountError = submitted && getCurrentAmount() <= 0 ? t('amountError') : null;

  // Form submission handler
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const currentAmount = getCurrentAmount();
    
    // Validate required fields
    if (!contact || currentAmount <= 0) {
      return;
    }

    // Validate contact field
    const contactValidationError = validateContact(contact);
    if (contactValidationError) {
      return;
    }

    // Only proceed if payment method is online (other methods may need different handling)
    if (paymentMethod !== 'online') {
      // For now, only handle online payments
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DonationCachePayload = {
        purpose: data.slug,
        contact: contact.trim(),
        amount: currentAmount,
        purposeLabel: translatedTitle || data.title,
        behalf: behalf || '',
        name: name || '',
      };
      
      // Store payload before redirecting to payment gateway
      storeDonationPayload(payload);
      
      fetch(`${config.api.baseUrl}/donations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
        //  console.log(result);
          window.location.replace(result.data.url);
        })
        .catch((error) => {
          console.error('Error preparing payment redirect:', error);
        //  window.location.href = '/payment/fail';
        });
    } catch (error) {
      console.error('Error preparing payment redirect:', error);
     // window.location.href = '/payment/fail';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header / Hero */}
      <section className="relative min-h-[60vh] md:min-h-[50vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${data.image}')` }}
        >
          <div className="absolute inset-0 bg-black/65"></div>
        </div>
        <Container className="relative z-10 py-12 md:py-20">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-white text-sm font-medium">{data.slug}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              {isTranslating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-pulse">{data.title}</span>
                  <span className="text-sm">...</span>
                </span>
              ) : (
                translatedTitle
              )}
            </h1>
          </div>
        </Container>
      </section>

      {/* Main two-column layout */}
      <div className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: video, subtitle, expenditureCategories, long description */}
            <div className="space-y-6">
              {videoId && (
                <div className="rounded-2xl overflow-hidden bg-gray-200">
                  <div className="aspect-video w-full relative">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={data.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {data.subtitle && (
                <p className="text-lg text-gray-700 leading-8">
                  {isTranslating ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-pulse">{data.subtitle}</span>
                      <span className="text-xs text-gray-400">...</span>
                    </span>
                  ) : (
                    translatedSubtitle
                  )}
                </p>
              )}

              {Array.isArray(data.expenditureCategories) && data.expenditureCategories.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-emerald-900 mb-4">{t('expenseCategory')}</h2>
                  <ul className="space-y-3">
                    {translatedCategories.map((category, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="text-gray-700 leading-7">
                          {isTranslating ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="animate-pulse">{data.expenditureCategories?.[idx] || ''}</span>
                              <span className="text-xs text-gray-400">...</span>
                            </span>
                          ) : (
                            category
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.description && (
                <div className="text-gray-700 leading-8 text-base space-y-4">
                  <p>
                    {isTranslating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-pulse">{data.description}</span>
                        <span className="text-xs text-gray-400">...</span>
                      </span>
                    ) : (
                      translatedDescription
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Right: form widget */}
            <div>
              <form onSubmit={onSubmit} className="rounded-2xl overflow-hidden border border-gray-200">
                {/* Green header */}
                <div className="bg-emerald-700 text-white p-6">
                  <h3 className="text-xl md:text-2xl font-bold">
                    {isTranslating ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-pulse">{data.formTitle || 'যুক্ত হোন আমাদের সঙ্গে'}</span>
                        <span className="text-sm">...</span>
                      </span>
                    ) : (
                      translatedFormTitle || t('joinUs')
                    )}
                  </h3>
                  {data.formDescription && (
                    <p className="mt-2 text-white/90">
                      {isTranslating ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-pulse">{data.formDescription}</span>
                          <span className="text-xs">...</span>
                        </span>
                      ) : (
                        translatedFormDescription
                      )}
                    </p>
                  )}
                </div>

                {/* Amount selection */}
                <div className="p-6 space-y-5">
                  {/* {!hasFlatPresets && (hasDaily || hasMonthly) && (
                    <div className="w-full">
                      <div className="inline-flex rounded-lg border border-emerald-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setTab('daily')}
                          className={`px-6 py-2 text-sm font-semibold transition-colors ${
                            tab === 'daily' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'
                          }`}
                        >
                          দৈনিক
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('monthly')}
                          className={`px-6 py-2 text-sm font-semibold transition-colors border-l border-emerald-200 ${
                            tab === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'
                          }`}
                        >
                          মাসিক
                        </button>
                      </div>
                    </div>
                  )}

                  {Array.isArray(activePresets) && activePresets.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {activePresets.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(amt);
                            setCustomAmount('');
                          }}
                          className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
                            selectedPreset === amt
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          ৳ {amt.toLocaleString('bn-BD')}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPreset(null);
                          setCustomAmount('');
                        }}
                        className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
                          selectedPreset == null
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        যে কোনো পরিমাণ
                      </button>
                    </div>
                  )} */}

{!hasFlatPresets && (hasDaily || hasMonthly) && (
  <div className="w-full">
    <div className="inline-flex rounded-lg border border-emerald-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setTab('daily')}
        className={`px-6 py-2 text-sm font-semibold transition-colors ${
          tab === 'daily' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'
        }`}
      >
        {t('today')}
      </button>
      <button
        type="button"
        onClick={() => setTab('monthly')}
        className={`px-6 py-2 text-sm font-semibold transition-colors border-l border-emerald-200 ${
          tab === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'
        }`}
      >
        {t('thisMonth')}
      </button>
    </div>
  </div>
)}

{Array.isArray(activePresets) && activePresets.length > 0 && (
  <div className="grid grid-cols-3 gap-3">
    {activePresets.map((amt) => (
      <button
        key={amt}
        type="button"
        onClick={() => {
          setSelectedPreset(amt);

          // Only clear input for DAILY/MONTHLY mode
          if (!hasFlatPresets) {
            setCustomAmount('');
          }
        }}
        className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
          selectedPreset === amt
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-gray-200 hover:border-emerald-300'
        }`}
      >
        ৳ {formatNumber(amt, lang)}
      </button>
    ))}

    <button
      type="button"
      onClick={() => {
        setSelectedPreset(null);
        setCustomAmount(''); // Clear input when selecting "any amount"
      }}
      className={`rounded-lg border px-4 py-3 font-semibold transition-colors ${
        selectedPreset == null
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      {t('amount')}
    </button>
  </div>
)}

                  {/* Amount input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('amount')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedPreset !== null ? `৳ ${formatNumber(selectedPreset, lang)}` : customAmount}
                      onChange={(e) => {
                        // Allow user to type freely when no preset is selected
                        if (selectedPreset === null) {
                          setCustomAmount(e.target.value);
                        }
                      }}
                      disabled={selectedPreset !== null}
                      placeholder={t('amountPlaceholder')}
                      className={`w-full rounded-lg px-4 py-3 ${
                        selectedPreset !== null
                          ? 'bg-gray-100 border border-gray-200 text-gray-700'
                          : 'bg-white border border-gray-300'
                      }`}
                    />
                    {amountError && <p className="mt-1 text-xs text-red-500">{amountError}</p>}
                  </div>

                  {/* Basic donor fields */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">{t('yourName')}</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder={t('write')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('contactLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder={t('contactPlaceholder')}
                      />
                      {contactError && <p className="mt-1 text-lg text-red-500">{contactError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-gray-700">{t('donateOnBehalf')}</label>
                      <input
                        type="text"
                        value={behalf}
                        onChange={(e) => setBehalf(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3"
                        placeholder={t('write')}
                      />
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('paymentMethod')} <span className="text-red-500">*</span>
                    </label>
                    <div className="rounded-lg border border-gray-200 p-3 flex items-center gap-6">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pm"
                          value="online"
                          checked={paymentMethod === 'online'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'online')}
                          className="accent-emerald-600"
                        />
                        <span className="font-semibold">{t('paymentMethodOnline')}</span>
                      </label>
                      {/* <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pm"
                          value="bank_transfer"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer')}
                          className="accent-emerald-600"
                        />
                        <span className="font-semibold">{t('paymentMethodBankTransfer')}</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pm"
                          value="bank_deposit"
                          checked={paymentMethod === 'bank_deposit'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'bank_deposit')}
                          className="accent-emerald-600"
                        />
                        <span className="font-semibold">{t('paymentMethodBankDeposit')}</span>
                      </label> */}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (t('submitting') || 'Submitting...') : t('donate')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}


