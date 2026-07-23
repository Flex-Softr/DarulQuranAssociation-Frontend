'use client';

import React from 'react';
import Button from '../../components/ui/Button';
import { removeClientToken } from '../../lib/tokenUtils';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../components/i18n/LanguageProvider';
import TokenMonitor from '../../components/auth/TokenMonitor';

type AdminHeaderProps = {
  user: {
    identifier: string;
    role: string;
  };
};

export default function AdminHeader({ user }: AdminHeaderProps): React.ReactElement {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      removeClientToken();
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <TokenMonitor />
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="h-14 px-4 md:px-6 flex items-center justify-between">
        <div className="font-semibold">{t('adminDashboard')}</div>
        <div className="flex items-center gap-3">
          {/* <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => {
                setLangOpen((v) => !v);
                setOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <span>{t(lang === 'bn' ? 'bengali' : lang === 'en' ? 'english' : 'arabic')}</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {langOpen && (
              <ul className="absolute right-0 mt-1 min-w-[140px] rounded-md border border-gray-200 bg-white shadow-lg z-50" role="listbox">
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setLang('bn'); setLangOpen(false); }}>{t('bengali')}</button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setLang('en'); setLangOpen(false); }}>{t('english')}</button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setLang('ar'); setLangOpen(false); }}>{t('arabic')}</button>
                </li>
              </ul>
            )}
          </div> */}
          <div className="relative" ref={userDropdownRef}>
            <button 
              onClick={() => {
                setOpen((v) => !v);
                setLangOpen(false);
              }} 
              className="flex items-center gap-2 rounded-full focus:outline-none"
            >
              {/* <img src="https://i.pravatar.cc/40" alt="admin" className="h-8 w-8 rounded-full border" /> */}
              <span className="hidden sm:flex flex-col items-start text-left leading-tight">
                <span className="text-sm font-medium text-gray-700">{user.identifier}</span>
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{user.role}</span>
              </span>
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg z-50">
                <a href="/dashboard/profile" className="block px-3 py-2 hover:bg-gray-50">{t('updateProfile')}</a>
                {/* <div className="px-3 py-2">
                  <Button type="button" variant="secondary" className="w-full" onClick={handleLogout}>
                    {t('logout')}
                  </Button>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}


