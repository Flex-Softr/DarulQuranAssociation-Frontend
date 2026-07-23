'use client';

import * as React from 'react';
import Input from '../../components/ui/Input';
import Select, { SelectOption } from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useI18n } from '../../components/i18n/LanguageProvider';
import {
  DonationCachePayload,
  SSL_COMMERZ_REDIRECT_URL,
  storeDonationPayload,
} from '../../lib/donationPayment';
import config from '../../config';

export type DonationFormProps = {
  purposes?: ReadonlyArray<SelectOption>;
};

// const purposeKeyMap: Record<string, keyof ReturnType<typeof useI18n>['t']> = {
//   'orphan_responsibility': 'orphanResponsibility',
//   'deprived_students': 'deprivedStudents',
//   'widow_responsibility': 'widowResponsibility',
//   'rehabilitation_poor_family': 'rehabilitationPoorFamily',
//   'tube_well_install': 'tubeWellInstall',
//   'wudu_place_install': 'wuduPlaceInstall',
//   'dowry_responsibility': 'dowryResponsibility',
//   'skill_development': 'skillDevelopment',
//   'winter_clothes': 'winterClothes',
//   'mosque_construction': 'mosqueConstruction',
//   'orphanage_construction': 'orphanageConstruction',
//   'zakat_fund': 'zakatFund',
//   'general_fund': 'generalFund',
//   'iftar_program': 'iftarProgram',
//   'qurbani_program': 'qurbaniProgram',
//   'emergency_relief': 'emergencyRelief',
//   'shelterless_housing': 'shelterlessHousing',
// };

export default function DonationForm({ purposes }: DonationFormProps): React.ReactElement {
  const { t } = useI18n();
  
  const defaultPurposes: ReadonlyArray<SelectOption> = [
    { value: '', label: t('selectFundPlaceholder') },
    { value: 'orphan_responsibility', label: t('orphanResponsibility') },
    { value: 'deprived_students', label: t('deprivedStudents') },
    { value: 'widow_responsibility', label: t('widowResponsibility') },
    { value: 'rehabilitation_poor_family', label: t('rehabilitationPoorFamily') },
    { value: 'tube_well_install', label: t('tubeWellInstall') },
    { value: 'wudu_place_install', label: t('wuduPlaceInstall') },
    { value: 'dowry_responsibility', label: t('dowryResponsibility') },
    { value: 'skill_development', label: t('skillDevelopment') },
    { value: 'winter_clothes', label: t('winterClothes') },
    { value: 'mosque_construction', label: t('mosqueConstruction') },
    { value: 'orphanage_construction', label: t('orphanageConstruction') },
    { value: 'zakat_fund', label: t('zakatFund') },
    { value: 'general_fund', label: t('generalFund') },
    { value: 'iftar_program', label: t('iftarProgram') },
    { value: 'qurbani_program', label: t('qurbaniProgram') },
    { value: 'emergency_relief', label: t('emergencyRelief') },
    { value: 'shelterless_housing', label: t('shelterlessHousing') }
  ];
  
  const displayPurposes = purposes || defaultPurposes;
  const [purpose, setPurpose] = React.useState<string>('');
  const [contact, setContact] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');
  const [submitted, setSubmitted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedLabel = displayPurposes.find((opt) => opt.value === purpose)?.label || t('selectFundPlaceholder');

  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const buildGatewayUrl = React.useCallback(
    (amountNumber: number, purposeValue: string) => {
      const paymentUrl = new URL(SSL_COMMERZ_REDIRECT_URL);
      paymentUrl.searchParams.set('amount', amountNumber.toFixed(2));
      if (purposeValue) {
        paymentUrl.searchParams.set('purpose', purposeValue);
      }
      return paymentUrl.toString();
    },
    [],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!purpose || !contact || !amount) return;

    // Validate contact field
    const contactValidationError = validateContact(contact);
    if (contactValidationError) {
      return;
    }

    const amountNumber = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DonationCachePayload = {
        purpose,
        contact: contact.trim(),
        amount: amountNumber,
        purposeLabel: selectedLabel,
      };
      // Store payload before redirecting to payment gateway
      storeDonationPayload(payload);
      fetch(`${config.api.baseUrl}/donations`,{
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(payload)
      })
      .then((res) => res.json())
      .then((result) => {
       // console.log(result);
        window.location.replace(result.data.url);
      })

    } catch (error) {
      console.error('Error preparing payment redirect:', error);
      window.location.href = '/payment/fail';
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeError = submitted && !purpose ? t('selectFundError') : null;
  const contactError = submitted ? validateContact(contact) : null;
  const amountError = submitted && !amount ? t('amountError') : null;

  return (
    <div className="relative rounded-3xl border border-brand/30 bg-brand/50 backdrop-blur-3xl p-6 sm:p-8 lg:p-10 shadow-2xl overflow-visible w-[300px] md: w-[500px] lg:w-[1100px] ">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-brand/10 to-brand/5 opacity-50 rounded-3xl "></div>
      
      {/* Glass morphism effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/12 via-brand/8 to-brand/12 backdrop-blur-2xl rounded-3xl "></div>
      
      {/* Subtle pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-8 w-full h-full overflow-hidden rounded-3xl " aria-hidden>
        <svg viewBox="0 0 90% 90%" className="h-full w-full fill-none stroke-brand/30 rounded-3xl ">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20h40M20 0v40" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <h2 className="relative z-10 text-center text-2xl sm:text-4xl font-bold text-white mb-6 drop-shadow-lg">
        {t('makeDonation')}
      </h2>
      <form onSubmit={onSubmit} className="relative z-10 space-y-4 flex gap-5 flex-col lg:flex-row lg:items-center ">
        <div className='mt-4 flex-1'>
          <label htmlFor="purpose" className="block text-[18px] font-medium mb-2 text-white drop-shadow-md">
            {t('selectFund')} <span className="text-red-300">{t('required')}</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Header */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full text-left rounded-lg border border-white/30 bg-white/20 backdrop-blur-md px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all flex items-center justify-between"
            >
              <span className={purpose ? 'text-white' : 'text-white/70'}>{selectedLabel}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown List */}
            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200">
                {/* Scrollable Options List */}
                <div className="overflow-y-auto custom-scrollbar rounded-t-lg" style={{ maxHeight: '300px' }}>
                  {displayPurposes.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPurpose(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-gray-900 font-semibold hover:bg-brand/20 transition-colors ${
                        purpose === opt.value ? 'bg-gray-100' : ''
                      } ${opt.value === '' ? 'text-gray-400' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Bottom indicator */}
                <div className="flex justify-end px-2 py-1 border-t border-gray-100 bg-white rounded-b-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          {purposeError && <p className="mt-1 text-lg text-red-300 drop-shadow-md">{purposeError}</p>}
        </div>
        
        {/* <div className="flex flex-col sm:flex-row gap-4"> */}
          <div className="flex-1">
            <label htmlFor="contact" className="block text-[18px] font-medium mb-2 text-white drop-shadow-md">
              {t('contactLabel')} <span className="text-red-300">{t('required')}</span>
            </label>
            <input
              id="contact"
              type="text"
              placeholder={t('contactPlaceholder')}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/20 backdrop-blur-md px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all"
            />
            {contactError && <p className="mt-1 text-lg text-red-300 drop-shadow-md">{contactError}</p>}
          </div>
          
          <div className="flex-1">
            <label htmlFor="amount" className="block text-[18px] font-medium mb-2 text-white drop-shadow-md">
              {t('amount')} <span className="text-red-300">{t('required')}</span>
            </label>
            <input
              id="amount"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={t('amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/20 backdrop-blur-md px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {amountError && <p className="mt-1 text-lg text-red-300 drop-shadow-md">{amountError}</p>}
          </div>
        {/* </div> */}
        
        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 px-4 py-6 text-xl font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (t('submitting') || 'Submitting...') : t('donate')}
          </Button>
        </div>
      </form>
      <p className="relative z-0 mt-4 text-center text-sm sm:text-md text-white/90 drop-shadow-md">
        {t('donationNote')} | <a className="underline hover:text-white transition-colors" href="#details">{t('clickForDetails')}</a>
      </p>
    </div>
  );
}


