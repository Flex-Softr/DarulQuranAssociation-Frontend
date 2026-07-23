'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { CountryData } from 'react-phone-input-2';
import Button from '../../components/ui/Button';
import {
  submitMemberApplication,
  type MemberApplicationData,
  type InitiateMemberPaymentPayload,
} from '../../services/memberApplication';
import { useI18n } from '../../components/i18n/LanguageProvider';
import config from '../../config';

const PhoneInput = dynamic(() => import('react-phone-input-2'), {
  ssr: false,
});

const BANGLADESH_ISO2 = 'bd';
const BANGLADESH_DIAL_CODE = '880';
const BANGLADESH_PREFIX = '+880';
const BANGLADESH_FLAG = '🇧🇩';

type Props = {
  embedded?: boolean;
};

export default function MemberApplication({ embedded = false }: Props): React.ReactElement {
  const { t } = useI18n();
  const [type, setType] = React.useState<'lifetime' | 'donor'>('lifetime');
  const [amount, setAmount] = React.useState('100000');
  const [name, setName] = React.useState('');
  const [fatherName, setFatherName] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');
  const [mobile, setMobile] = React.useState('');
  const [isOverseas, setIsOverseas] = React.useState(false);
  const [mobileDialCode, setMobileDialCode] = React.useState(BANGLADESH_DIAL_CODE);
  const [mobileCountryIso, setMobileCountryIso] = React.useState(BANGLADESH_ISO2);
  const [email, setEmail] = React.useState('');
  const [occupation, setOccupation] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'online' | 'bank_transfer' | 'bank_deposit'>('online');
  const [transactionId, setTransactionId] = React.useState('');
  const [paymentDocument, setPaymentDocument] = React.useState<File | null>(null);
  const [amountError, setAmountError] = React.useState('');
  const [fileError, setFileError] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  // Update amount when type changes
  React.useEffect(() => {
    if (type === 'lifetime') {
      setAmount('100000');
    } else {
      setAmount('50000');
    }
    setAmountError('');
    setFileError('');
    setEmailError('');
  }, [type]);

  const minAmount = type === 'lifetime' ? 100000 : 50000;
  const phoneInputValue = React.useMemo(() => {
    const digitsOnly = mobile.replace(/\D/g, '');
    return digitsOnly ? `${mobileDialCode}${digitsOnly}` : mobileDialCode;
  }, [mobile, mobileDialCode]);

  const clearFieldError = React.useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }, [setFieldErrors]);

  const validateMobile = React.useCallback((mobileValue: string, isOverseasValue: boolean): string => {
    const digitsOnly = mobileValue.replace(/\D/g, '');
    
    if (!digitsOnly) {
      return t('fillThisField');
    }
    
    if (isOverseasValue) {
      // Overseas: 7 to 14 digits
      if (digitsOnly.length < 7 || digitsOnly.length > 14) {
        return t('mobileOverseasInvalid');
      }
    } else {
      // Bangladesh: exactly 11 digits
      if (digitsOnly.length !== 11) {
        return t('mobileBangladeshInvalid');
      }
    }
    
    return '';
  }, [t]);

  const validateEmail = React.useCallback((emailValue: string): string => {
    if (!emailValue.trim()) {
      return '';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      return t('invalidEmail');
    }
    
    return '';
  }, [t]);

  const handleOverseasPhoneChange = React.useCallback(
    (value: string, data: CountryData | {}) => {
      const countryData = data as CountryData;
      const dialCode = countryData?.dialCode ?? mobileDialCode;
      const iso = countryData?.countryCode ? countryData.countryCode.toLowerCase() : mobileCountryIso;
      const digitsOnly = value.replace(/\D/g, '');
      const nationalNumber = digitsOnly.startsWith(dialCode) ? digitsOnly.slice(dialCode.length) : digitsOnly;

      setMobileDialCode(dialCode);
      setMobileCountryIso(iso);
      setMobile(nationalNumber);
      
      // Validate mobile
      const mobileError = validateMobile(nationalNumber, true);
      if (mobileError) {
        setFieldErrors((prev) => ({ ...prev, mobile: mobileError }));
      } else {
        clearFieldError('mobile');
      }
    },
    [clearFieldError, mobileCountryIso, mobileDialCode, validateMobile]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setFileError('');
    setEmailError('');
    
    const errors: Record<string, string> = {};
    let hasError = false;
    const requiredMessage = t('fillThisField');

    if (!amount.trim()) {
      setAmountError(t('pleaseProvideAmount'));
      hasError = true;
    } else {
      const amountNum = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(amountNum) || amountNum < minAmount) {
        setAmountError(`${t('minimumAmountRequired')} ${minAmount.toLocaleString('en-US')} ${t('takaRequired')}`);
        hasError = true;
      }
    }

    if (!name.trim()) {
      errors.name = requiredMessage;
      hasError = true;
    }

    if (!fatherName.trim()) {
      errors.fatherName = requiredMessage;
      hasError = true;
    }

    if (!mobile.trim()) {
      errors.mobile = requiredMessage;
      hasError = true;
    } else {
      // Validate mobile format
      const mobileValidationError = validateMobile(mobile, isOverseas);
      if (mobileValidationError) {
        errors.mobile = mobileValidationError;
        hasError = true;
      }
    }

    if (!occupation.trim()) {
      errors.occupation = requiredMessage;
      hasError = true;
    }

    if (!address.trim()) {
      errors.address = requiredMessage;
      hasError = true;
    }
    
    // Email validation
    if (isOverseas && !email.trim()) {
      setEmailError(t('emailRequiredForOverseas'));
      hasError = true;
    } else if (email.trim()) {
      // Validate email format if provided
      const emailValidationError = validateEmail(email);
      if (emailValidationError) {
        setEmailError(emailValidationError);
        hasError = true;
      }
    }
    
    if (paymentMethod === 'bank_transfer') {
      if (!transactionId.trim()) {
        errors.transactionId = t('provideTransactionId');
        hasError = true;
      }
      if (!paymentDocument) {
        setFileError(t('documentUploadRequired'));
        hasError = true;
      }
    }

    if (paymentMethod === 'bank_deposit' && !paymentDocument) {
      setFileError(t('documentUploadRequired'));
      hasError = true;
    }

    setFieldErrors(errors);
    setSubmitError('');
    
    if (hasError) {
      return;
    }
    
    const amountNum = parseFloat(amount.replace(/,/g, ''));
    
    // Handle online payment - redirect to SSLCommerz
    if (paymentMethod === 'online') {
      handleOnlinePayment(amountNum);
      return;
    }
    
    // Handle bank transfer and deposit - submit directly
    handleDirectSubmission(amountNum);
  };

  const formatMobileNumber = React.useCallback(() => {
    const sanitized = mobile.trim();
    if (!sanitized) {
      return '';
    }
    const dialCode = mobileDialCode ? `+${mobileDialCode}` : '';
    return dialCode ? `${dialCode}-${sanitized}` : sanitized;
  }, [mobile, mobileDialCode]);

  const handleOnlinePayment = async (amountNum: number) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const paymentPayload: InitiateMemberPaymentPayload = {
        type,
        amount: amountNum,
        name,
        fatherName,
        gender,
        mobile: formatMobileNumber(),
        isOverseas,
        email: email.trim() || undefined,
        occupation: occupation,
        reference: reference.trim() || undefined,
        address,
        paymentMethod: 'online',
      };

      fetch(`${config.api.baseUrl}/members/online-payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      })
        .then((res) => res.json())
        .then((result) => {
         // console.log(result);
          window.location.replace(result.data.url);
        })
        .catch((error) => {
          console.error('Error preparing payment redirect:', error);
        //  window.location.href = '/payment/fail';
        });

      // If gateway URL not returned, show error
    //  setSubmitError(response.message || t('paymentGatewayError'));
    } catch (error) {
      console.error('Error initiating payment:', error);
      setSubmitError(t('paymentInitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectSubmission = async (amountNum: number) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const applicationData: MemberApplicationData = {
        type,
        amount: amountNum,
        name,
        fatherName,
        gender,
        mobile: formatMobileNumber(),
        isOverseas,
        email: email.trim() || undefined,
        occupation,
        reference: reference.trim() || undefined,
        address,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paymentDocument: paymentDocument || undefined,
      };

      const response = await submitMemberApplication(applicationData);

      if (response.success) {
        alert(t('memberAppSuccess'));
        // Reset form
        setName('');
        setFatherName('');
        setMobile('');
        setEmail('');
        setOccupation('');
        setReference('');
        setAddress('');
        setTransactionId('');
        setPaymentDocument(null);
        setPaymentMethod('online');
      } else {
        setSubmitError(response.message || t('memberAppError'));
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError(t('memberAppError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const BankAccountCard = () => (
    <div className="rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full border border-emerald-200 bg-white flex items-center justify-center">
          <span className="text-2xl">🏛️</span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold text-emerald-700">{t('bank')}</span>
            <span className="text-gray-800">Islami Bank Bangladesh PLC</span>
            <span className="font-semibold text-emerald-700">{t('accountName')}</span>
            <span className="text-gray-800">As sunnah Foundation</span>
            <span className="font-semibold text-emerald-700">{t('branch')}</span>
            <span className="text-gray-800">Badda, Dhaka</span>
            <span className="font-semibold text-emerald-700">{t('accountNumber')}</span>
            <span className="text-gray-800">20503100201496517</span>
            <span className="font-semibold text-emerald-700">{t('routingNumber')}</span>
            <span className="text-gray-800">125260341</span>
            <span className="font-semibold text-emerald-700">{t('swiftCode')}</span>
            <span className="text-gray-800">IBBLBDDH</span>
          </div>
        </div>
      </div>
    </div>
  );

  React.useEffect(() => {
    if (!isOverseas) {
      setEmailError('');
      setMobileCountryIso(BANGLADESH_ISO2);
      setMobileDialCode(BANGLADESH_DIAL_CODE);
    }
  }, [isOverseas]);

  const Form = (
    <form onSubmit={onSubmit} className="space-y-4">
        {/* Toggle tabs */}
        <div className="rounded-xl border border-emerald-100 p-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('lifetime')}
            className={`py-2 font-semibold rounded-lg border ${type === 'lifetime' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'}`}
          >
            {t('lifetimeMemberType')}
          </button>
          <button
            type="button"
            onClick={() => setType('donor')}
            className={`py-2 font-semibold rounded-lg border ${type === 'donor' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'}`}
          >
            {t('donorMemberType')}
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {type === 'lifetime'
              ? t('memberAppLifetimeAmount')
              : t('memberAppDonorAmount')}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError('');
            }}
            inputMode="numeric"
            className={`w-full rounded-lg border px-3 py-2 ${amountError ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={type === 'lifetime' ? '৳ 100,000' : '৳ 50,000'}
          />
          {amountError && (
            <p className="text-red-500 text-sm mt-1">{amountError}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('name')} <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.name ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('write')}
          />
          {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Father name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('fatherName')} <span className="text-red-500">*</span>
          </label>
          <input
            value={fatherName}
            onChange={(e) => {
              setFatherName(e.target.value);
              clearFieldError('fatherName');
            }}
            className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.fatherName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('write')}
          />
          {fieldErrors.fatherName && <p className="text-red-500 text-sm mt-1">{fieldErrors.fatherName}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('iAmA')} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === 'male'} onChange={() => setGender('male')} /> {t('male')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="gender" checked={gender === 'female'} onChange={() => setGender('female')} /> {t('female')}
            </label>
          </div>
        </div>

        {/* Mobile */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium mb-1">
              {t('mobileNumber')} <span className="text-red-500">*</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isOverseas} onChange={(e) => setIsOverseas(e.target.checked)} />
              <span>{t('volunteerFormOverseas')}</span>
            </label>
          </div>
          {isOverseas ? (
            <PhoneInput
              country={mobileCountryIso}
              value={phoneInputValue}
              onChange={handleOverseasPhoneChange}
              enableSearch
              disableSearchIcon
              searchPlaceholder="Search..."
              placeholder={t('enterPhoneNumber')}
              specialLabel=""
              countryCodeEditable={false}
              prefix="+"
              inputProps={{
                name: 'overseas-mobile',
                autoComplete: 'tel',
                required: true,
              }}
              containerClass="w-full phone-input-container"
              inputClass={`phone-input-field ${fieldErrors.mobile ? 'phone-input-field-error' : ''}`}
              buttonClass="phone-input-flag"
              dropdownClass="phone-input-dropdown custom-scrollbar"
              searchClass="phone-input-search"
              
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold">
                <span className="text-lg">{BANGLADESH_FLAG}</span>
                <span>{BANGLADESH_PREFIX}</span>
              </div>
              <input
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value;
                  setMobile(value);
                  
                  // Validate mobile
                  const mobileError = validateMobile(value, false);
                  if (mobileError) {
                    setFieldErrors((prev) => ({ ...prev, mobile: mobileError }));
                  } else {
                    clearFieldError('mobile');
                  }
                }}
                className={`flex-1 rounded-lg border px-3 py-2 ${fieldErrors.mobile ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="01XXXXXXXXX"
              />
            </div>
          )}
          {fieldErrors.mobile && <p className="text-red-500 text-sm mt-1">{fieldErrors.mobile}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('email')}
            {isOverseas && (
              <span className="text-red-500"> *</span>
            )}
          </label>
          <input
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              setEmail(value);
              
              // Validate email format
              const emailValidationError = validateEmail(value);
              setEmailError(emailValidationError);
            }}
            className={`w-full rounded-lg border px-3 py-2 ${emailError ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('emailPlaceholder')}
          />
          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
        </div>

        {/* District/Thana */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('profession')} <span className="text-red-500">*</span>
            </label>
            <select
              value={occupation}
              onChange={(e) => {
                setOccupation(e.target.value);
                clearFieldError('job');
              }}
              className={`w-full rounded-lg border px-3 py-2 bg-white ${fieldErrors.occupation ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">{t('selectProfession')}</option>
              <option value="গৃহিণী">গৃহিণী</option>
              <option value="সরকারি কর্মচারী">সরকারি কর্মচারী</option>
              <option value="বেসরকারি কর্মচারী">বেসরকারি কর্মচারী</option>
              <option value="বেকার">বেকার</option>
            
              <option value="ব্যবসায়ী">ব্যবসায়ী</option>
              <option value="কম্পিউটার প্রোগ্রামার">কম্পিউটার প্রোগ্রামার</option>
              <option value="কারুশিল্পী / হস্তশিল্পী">কারুশিল্পী / হস্তশিল্পী</option>
              <option value="সাংবাদিক">সাংবাদিক</option>
              <option value="সমাজকর্মী">সমাজকর্মী</option>
              <option value="গ্রাফিক ডিজাইনার">গ্রাফিক ডিজাইনার</option>
              <option value="ব্যাংকার">ব্যাংকার</option>
              <option value="শিক্ষার্থী">শিক্ষার্থী</option>
            
              <option value="ইমাম">ইমাম</option>
              <option value="মুয়াজ্জিন">মুয়াজ্জিন</option>
              <option value="ডাক্তার">ডাক্তার</option>
              <option value="শিক্ষক">শিক্ষক</option>
              <option value="লেখক">লেখক</option>
              <option value="কৃষক">কৃষক</option>
              <option value="প্রকৌশলী">প্রকৌশলী</option>
              <option value="আইনজীবী">আইনজীবী</option>
            </select>
            {fieldErrors.occupation && <p className="text-red-500 text-sm mt-1">{fieldErrors.occupation}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('reference')}</label>
            <input
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              clearFieldError('reference');
            }}
            className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.reference ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('write')}
          />
          {fieldErrors.reference && <p className="text-red-500 text-sm mt-1">{fieldErrors.reference}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('address')} <span className="text-red-500">*</span>
          </label>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearFieldError('address');
            }}
            className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.address ? 'border-red-400' : 'border-gray-300'}`}
            placeholder={t('write')}
          />
          {fieldErrors.address && <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>}
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {t('paymentMethodChoice')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={()=>setPaymentMethod('online')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${paymentMethod==='online' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'}`}>{t('onlinePayment')}</button>
            <button type="button" onClick={()=>setPaymentMethod('bank_transfer')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${paymentMethod==='bank_transfer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'}`}>{t('bankTransfer')}</button>
            <button type="button" onClick={()=>setPaymentMethod('bank_deposit')} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${paymentMethod==='bank_deposit' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-emerald-200'}`}>{t('bankDeposit')}</button>
          </div>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div className="space-y-4 rounded-xl border border-emerald-100 p-4">
            <BankAccountCard />
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('transactionReferenceId')} <span className="text-red-500">*</span>
              </label>
              <input
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  clearFieldError('transactionId');
                }}
                className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.transactionId ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="TRX123456"
              />
              {fieldErrors.transactionId && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.transactionId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('uploadPaymentDocument')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && !(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
                    setPaymentDocument(null);
                    setFileError(t('onlyPdfOrImage'));
                    return;
                  }
                  setPaymentDocument(file ?? null);
                  setFileError('');
                }}
                className={`w-full rounded-lg border px-3 py-2 ${fileError ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
              {paymentDocument && !fileError && (
                <p className="text-sm text-gray-600 mt-1">{paymentDocument.name}</p>
              )}
            </div>
            <p className="text-xs text-gray-500">{t('uploadReceiptNote')}</p>
          </div>
        )}

        {paymentMethod === 'bank_deposit' && (
          <div className="space-y-4 rounded-xl border border-emerald-100 p-4">
            <BankAccountCard />
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('uploadPaymentDocument')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && !(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
                    setPaymentDocument(null);
                    setFileError(t('onlyPdfOrImage'));
                    return;
                  }
                  setPaymentDocument(file ?? null);
                  setFileError('');
                }}
                className={`w-full rounded-lg border px-3 py-2 ${fileError ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
              {paymentDocument && !fileError && (
                <p className="text-sm text-gray-600 mt-1">{paymentDocument.name}</p>
              )}
            </div>
            <p className="text-xs text-gray-500">{t('uploadDepositNote')}</p>
          </div>
        )}

        {paymentMethod === 'online' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              {t('paymentGateway')} <span className="text-red-500">*</span>
            </label>
            <div className="rounded-2xl border border-emerald-50 bg-white p-4 flex items-center gap-4">
              <div className="h-7 w-7 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-600" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#004a99]/10 px-3 py-1 text-sm font-semibold text-[#004a99]">
                SSLCommerz
              </span>
            </div>
          </div>
        )}

        {submitError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? (paymentMethod === 'online' ? t('openingPaymentPage') : t('submittingApplication')) 
            : t('donateNow')}
        </Button>

        {/* Footer note */}
        <p className="text-xs text-gray-600 leading-6">
          {t('memberAppNote')}
        </p>
    </form>
  );

  if (embedded) {
    return Form;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-extrabold text-emerald-900 mb-3">{t('memberAppTitle')}</h3>
      {Form}
    </div>
  );
}


