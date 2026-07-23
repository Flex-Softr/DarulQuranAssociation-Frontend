'use client';

import React from 'react';
import Button from '../../components/ui/Button';
import { useState } from 'react';
import { useI18n } from '../../components/i18n/LanguageProvider';

type Props = {
  onChange?: (val: { preset: 'today' | 'week' | 'month' | 'year' | 'range'; from?: string; to?: string }) => void;
};

export default function FiltersBar({ onChange }: Props): React.ReactElement {
  const { t } = useI18n();
  const [preset, setPreset] = useState<'today' | 'week' | 'month' | 'year' | 'range'>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const apply = () => onChange?.({ preset, from, to });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">{t('preset')}</label>
        <select value={preset} onChange={(e)=>setPreset(e.target.value as any)} className="rounded-lg border px-3 py-2">
          <option value="today">{t('today')}</option>
          <option value="week">{t('thisWeek')}</option>
          <option value="month">{t('thisMonth')}</option>
          <option value="year">{t('thisYear')}</option>
          <option value="range">{t('customRange')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('from')}</label>
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('to')}</label>
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-lg border px-3 py-2" />
      </div>
      <div className="mb-1">
        <Button onClick={apply}>{t('apply')}</Button>
      </div>
    </div>
  );
}


