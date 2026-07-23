'use client';

import React from 'react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../components/i18n/LanguageProvider';

export default function ContactForm(): React.ReactElement {
  const { t } = useI18n();
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('yourName')} {t('required')}</label>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('yourEmail')} {t('required')}</label>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('subject')}</label>
        <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('message')}</label>
        <textarea rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t('write')} />
      </div>
      <Button type="submit">{t('send')}</Button>
    </form>
  );
}


