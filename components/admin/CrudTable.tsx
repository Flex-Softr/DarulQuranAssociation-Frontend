'use client';

import React from 'react';
import Button from '../../components/ui/Button';
import MediaUploader from '../../components/common/MediaUploader';
import { useState } from 'react';
import { useI18n } from '../../components/i18n/LanguageProvider';

export type Column<T> = { key: keyof T; label: string };

type Props<T> = {
  title: string;
  columns: Column<T>[];
  initialRows: T[];
  onChange?: (rows: T[]) => void;
};

export default function CrudTable<T extends { id: string }>({ title, columns, initialRows, onChange }: Props<T>): React.ReactElement {
  const { t } = useI18n();
  const [rows, setRows] = useState<T[]>(initialRows);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<T>>({});

  const openNew = () => { setDraft({} as Partial<T>); setModalOpen(true); };
  const openEdit = (row: T) => { setDraft(row); setModalOpen(true); };
  const remove = (id: string) => { const next = rows.filter(r => r.id !== id); setRows(next); onChange?.(next); };
  const save = () => {
    let next: T[];
    if (draft && 'id' in draft && rows.find(r => r.id === (draft as T).id)) {
      next = rows.map(r => r.id === (draft as T).id ? (draft as T) : r);
    } else {
      const id = (draft as any).id || `id-${Date.now()}`;
      next = [...rows, { ...(draft as T), id }];
    }
    setRows(next); onChange?.(next); setModalOpen(false);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <Button onClick={openNew}>{t('new')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              {columns.map((c) => (<th key={String(c.key)} className="py-2 pr-4">{c.label}</th>))}
              <th className="py-2 pr-4">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                {columns.map((c) => (
                  <td key={String(c.key)} className="py-2 pr-4">{String(r[c.key])}</td>
                ))}
                <td className="py-2 pr-4 space-x-2">
                  <Button onClick={()=>openEdit(r)} variant="secondary">{t('edit')}</Button>
                  <Button onClick={()=>remove(r.id)} variant="danger">{t('delete')}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-lg">
            <h4 className="font-semibold mb-3">{t('edit')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {columns.map((c) => {
                const k = String(c.key).toLowerCase();
                const isMedia = k.includes('image') || k.includes('src') || k.includes('avatar');
                return (
                  <div key={String(c.key)} className={isMedia ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-medium mb-1">{c.label}</label>
                    {isMedia ? (
                      <MediaUploader
                        value={(draft as any)[c.key] as any}
                        onChange={(val) => setDraft({ ...(draft as any), [c.key]: val } as Partial<T>)}
                        multiple={false}
                        accept="image/*"
                        label={t('uploadImage')}
                      />
                    ) : (
                      <input className="w-full rounded-lg border px-3 py-2" value={String((draft as any)[c.key] ?? '')} onChange={(e)=>setDraft({ ...(draft as any), [c.key]: e.target.value } as Partial<T>)} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>setModalOpen(false)}>{t('cancel')}</Button>
              <Button onClick={save}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


