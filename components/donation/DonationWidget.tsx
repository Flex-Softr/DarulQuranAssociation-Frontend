'use client';

import * as React from 'react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../components/i18n/LanguageProvider';
import {
  DonationCachePayload,
  storeDonationPayload,
} from '../../lib/donationPayment';
import config from '../../config';

type Period = 'daily' | 'monthly';

export default function DonationWidget() {
  const { t } = useI18n();
  const [period, setPeriod] = React.useState<Period>('daily');
  const [amount, setAmount] = React.useState<string>('20');
  const [name, setName] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [behalf, setBehalf] = React.useState('');
  const [method, setMethod] = React.useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAmountEditable, setIsAmountEditable] = React.useState(false);

  const dailyPresetsTop = ['10', '20', '30'];
  const dailyPresetsBottom = ['50', '100'];
  const monthlyPresetsTop = ['300', '500', '1000'];
  const monthlyPresetsBottom = ['2000', '5000'];

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

  const contactError = submitted ? validateContact(contact) : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!contact || !amount) return;

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
      const purposeLabel = period === 'daily' 
        ? `${t('daily')} ${t('donation')}` 
        : `${t('monthly')} ${t('donation')}`;

      const payload: DonationCachePayload = {
        purpose: purposeLabel, 
        contact: contact.trim(),
        amount: amountNumber,
        purposeLabel,
        name: name || undefined,
        behalf: behalf || undefined,
      };
      
      // Store payload before redirecting to payment gateway
      storeDonationPayload(payload);
      
      fetch(`${config.api.baseUrl}/donations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((result) => {
         // console.log(result);
          if (result.data?.url) {
            window.location.replace(result.data.url);
          } else {
            throw new Error('No payment URL in response');
          }
        })
        .catch((error) => {
          console.error('Error preparing payment redirect:', error);
          window.location.href = '/payment/fail';
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } catch (error) {
      console.error('Error preparing payment redirect:', error);
      window.location.href = '/payment/fail';
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    // Set sensible default when period changes
    if (period === 'daily') {
      setAmount('20');
    } else {
      setAmount('300');
    }
    setIsAmountEditable(false); // Disable amount field when period changes
  }, [period]);

  return (
    <div className="rounded-2xl bg-emerald-700 text-white shadow overflow-hidden">
      <div className="p-5">
        <h3 className="text-xl font-extrabold leading-tight">{t('donationWidgetTitle')}</h3>
        <p className="mt-2 text-emerald-50 text-sm">
          {t('donationWidgetDesc')}
        </p>
      </div>
      <form onSubmit={onSubmit} className="bg-white text-gray-900 rounded-t-2xl p-5 space-y-4">
        {/* period tabs - pill style */}
        <div className="rounded-xl border border-emerald-100 p-1 grid grid-cols-2 gap-2">
          {([
            { id: 'daily', label: t('daily') },
            { id: 'monthly', label: t('monthly') },
          ] as const).map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                className={`py-2 font-semibold rounded-lg border ${
                  isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* preset amounts areas */}
        {period === 'daily' ? (
          <>
            <div className="rounded-xl border border-emerald-100 p-3 grid grid-cols-3 gap-3">
              {dailyPresetsTop.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded-lg border py-2 font-semibold ${amount === v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-emerald-200'}`}
                  onClick={() => {
                    setAmount(v);
                    setIsAmountEditable(false);
                  }}
                >
                  ৳ {v}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-emerald-100 p-3 grid grid-cols-3 gap-3">
              {dailyPresetsBottom.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded-lg border py-2 font-semibold ${amount === v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-emerald-200'}`}
                  onClick={() => {
                    setAmount(v);
                    setIsAmountEditable(false);
                  }}
                >
                  ৳ {v}
                </button>
              ))}
              <button
                type="button"
                className={`rounded-lg border py-2 font-semibold ${!dailyPresetsTop.concat(dailyPresetsBottom).includes(amount) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-emerald-200'}`}
                onClick={() => {
                  setAmount('');
                  setIsAmountEditable(true);
                }}
              >
                {t('anyAmount')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {monthlyPresetsTop.map((v) => (
                <button key={v} type="button" className={`rounded-lg border py-2 font-semibold ${amount === v ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white'}`} onClick={() => {
                  setAmount(v);
                  setIsAmountEditable(false);
                }}>৳ {v}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {monthlyPresetsBottom.map((v) => (
                <button key={v} type="button" className={`rounded-lg border py-2 font-semibold ${amount === v ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white'}`} onClick={() => {
                  setAmount(v);
                  setIsAmountEditable(false);
                }}>৳ {v}</button>
              ))}
              <button type="button" className={`rounded-lg border py-2 font-semibold ${!monthlyPresetsTop.concat(monthlyPresetsBottom).includes(amount) ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white'}`} onClick={() => {
                setAmount('');
                setIsAmountEditable(true);
              }}>{t('anyAmount')}</button>
            </div>
          </>
        )}

        {/* fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('donationAmount')} *</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" disabled={!isAmountEditable} className={`w-full rounded-lg border px-3 py-2 ${submitted && !amount ? 'border-red-400' : 'border-gray-300'} ${!isAmountEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="৳ 300" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('yourName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('mobileOrEmail')} *</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={`w-full rounded-lg border px-3 py-2 ${contactError ? 'border-red-400' : 'border-gray-300'}`} placeholder={t('contactPlaceholder')} />
            {contactError && <p className="mt-1 text-lg text-red-500">{contactError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('donateOnBehalf')}</label>
            <input value={behalf} onChange={(e) => setBehalf(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
          </div>
        </div>

        {/* payment methods */}
        <div className="rounded-xl border p-4 space-y-3">
          <div className="text-sm font-semibold mb-1">{t('paymentMethod')} *</div>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="method" checked={method === 'bkash'} onChange={() => setMethod('bkash')} /> {t('bkash')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="method" checked={method === 'nagad'} onChange={() => setMethod('nagad')} /> {t('nagad')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} /> {t('card')}
            </label>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (t('submitting') || 'Submitting...') : t('nextStep')}
        </Button>
      </form>
    </div>
  );
}


