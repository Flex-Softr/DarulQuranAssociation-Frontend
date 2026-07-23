'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { createPortal } from 'react-dom';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import logo from '../../public/img/logo-foundation.png';
import Image from 'next/image';
import { Route } from 'next';
import { useI18n } from '../../components/i18n/LanguageProvider';
import type { Lang } from '../../components/i18n/LanguageProvider';
import { getClientToken, removeClientToken } from '../../lib/tokenUtils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type NavItem = { href: string; labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0] };

const navItems: ReadonlyArray<NavItem> = [
  { href: '', labelKey: 'home' },
  { href: 'about', labelKey: 'about' },
  { href: 'programs', labelKey: 'programs' },
  { href: 'gallery', labelKey: 'gallery' },
  { href: 'get-involved', labelKey: 'join' },
  { href: 'blog', labelKey: 'blog' },
  { href: 'notice', labelKey: 'notice' },
  { href: 'contact', labelKey: 'contact' },
];

const getRoleFromToken = (token: string | null): string | null => {
  if (!token || token.split('.').length !== 3) return null;
  try {
    const payloadSegment = token.split('.')[1];
    const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalizedPayload));
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
};

export default function Header(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const { lang, setLang, t } = useI18n();
  const [langOpen, setLangOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [authed, setAuthed] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    const updateAuthState = () => {
      const token = getClientToken();
      setAuthed(!!token);
      setUserRole(getRoleFromToken(token));
    };
    updateAuthState();
    const handleStorage: EventListener = () => updateAuthState();
    window.addEventListener('storage', handleStorage);
    const handleAuthChange: EventListener = () => updateAuthState();
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      removeClientToken();
      setAuthed(false);
      setUserRole(null);
      // Dispatch auth-change event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-change'));
      }
    }
    router.push('/login');
    router.refresh();
  };

  // Helper function to add line break before last word
  const formatFoundationName = (text: string) => {
    const words = text.split(' ');
    if (words.length <= 1) return text;
    const lastWord = words[words.length - 1];
    const rest = words.slice(0, -1).join(' ');
    return (
      <>
        {rest} <br /> {lastWord}
      </>
    );
  };

  const isDashboardUser = userRole === 'admin' || userRole === 'editor';
  const userMenuTarget = (isDashboardUser ? '/dashboard' : '/profile') as Route;
  const handleLanguageChange = React.useCallback(
    (nextLang: Lang) => {
      setLang(nextLang);
      setLangOpen(false);
      toast.success(t('languageSwitchSuccess', nextLang));
    },
    [setLang, t]
  );

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-200">
      <Container className="h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          
          <Link href="/" className="inline-flex items-center gap-0">
           <Image src={logo} alt="logo" width={76} height={76} className="hidden sm:block"/>
           <Image src={logo} alt="logo" width={56} height={56} className="block sm:hidden"/>
           <span className=" text-xl md:text-md font-bold leading-tight">{formatFoundationName(t('foundationName'))}</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-sm mx-0">
          {navItems.map((item: NavItem, index: number) => {
            const href = `/${item.href}`;
            const isActive = pathname === href || (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={index}
                className={`relative hover:text-brand text-[18px] transition-base ${isActive ? 'text-brand' : ''}`}
                href={href as Route}
              >
                {t(item.labelKey)}
                {isActive && (
                  <span className="absolute bottom-0 top-6 left-0 right-0 h-0.5 bg-brand"></span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <span>{t(lang === 'bn' ? 'bengali' : lang === 'en' ? 'english' : 'arabic')}</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>
            {langOpen && (
              <ul className="absolute right-0 mt-1 min-w-[140px] rounded-md border border-gray-200 bg-white shadow-lg z-50 text-md" role="listbox">
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('bn')}>{t('bengali')}</button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('en')}>{t('english')}</button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('ar')}>{t('arabic')}</button>
                </li>
              </ul>
            )}
          </div>
          {!authed ? (
            <Link href="/login" className="hidden sm:block rounded-lg px-3 py-1.5 border text-sm">{t('login')}</Link>
          ) : (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 1 5 5v1a5 5 0 1 1-10 0V7a5 5 0 0 1 5-5Zm0 12c4.418 0 8 2.239 8 5v1H4v-1c0-2.761 3.582-5 8-5Z"/></svg>
              </button>
              {userMenuOpen && (
                <ul className="absolute right-0 mt-2 min-w-[160px] rounded-md border border-gray-200 bg-white shadow-lg z-50" role="menu">
                  <li>
                    <Link href={userMenuTarget} className="block px-3 py-2 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              )}
            </div>
          )}
          <Link href="/donation">
            <Button className="rounded-lg bg-brand hover:bg-brand-dark text-white px-4 py-2 font-semibold transition-all hover:shadow-lg text-md md:text-lg">{t('donate')}</Button>
          </Link>
          <button className="lg:hidden inline-flex items-center justify-center p-2 rounded-md border border-gray-300" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm.75 5.25a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {open && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] !bg-white shadow-xl p-4 flex flex-col border-r border-gray-200" style={{ backgroundColor: '#ffffff' }}>
            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
            <Link href="/" className="inline-flex items-center gap-2">
           <Image src={logo} alt="logo" width={76} height={76} className="hidden sm:block"/>
           <Image src={logo} alt="logo" width={56} height={56} className="block sm:hidden"/>
           <span className="font-semibold text-xl md:text-xl">{formatFoundationName(t('foundationName'))}</span>
          </Link>
              <button className="p-2 rounded-md border" onClick={() => setOpen(false)} aria-label="Close menu">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item: NavItem) => {
                const href = `/${item.href}`;
                const isActive = pathname === href || (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 hover:bg-gray-100 relative text-xl ${
                      isActive ? 'text-brand bg-brand/10' : ''
                    }`}
                    href={href as Route}
                  >
                    {t(item.labelKey)}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-r"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 flex items-center gap-2">
              <div className="relative">
                <button onClick={()=>setLangOpen((v)=>!v)} className="px-3 py-1.5 text-sm rounded border border-gray-300 inline-flex items-center gap-2">
                  <span>{t(lang === 'bn' ? 'bengali' : lang === 'en' ? 'english' : 'arabic')}</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-4.24-4.24z"/></svg>
                </button>
                {langOpen && (
                  <ul className="absolute left-0 bottom-full mb-1 min-w-[140px] rounded-md border border-gray-200 bg-white shadow-lg z-50 text-xl">
                    <li><button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('bn')}>{t('bengali')}</button></li>
                    <li><button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('en')}>{t('english')}</button></li>
                    <li><button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>handleLanguageChange('ar')}>{t('arabic')}</button></li>
                  </ul>
                )}
              </div>
              {!authed ? (
                <Link href="/login" onClick={() => setOpen(false)} className="ml-auto px-3 py-1.5 rounded border text-xl">{t('login')}</Link>
              ) : (
                <div className="ml-auto flex items-center gap-2">
                  <Link href={userMenuTarget} onClick={() => setOpen(false)} className="px-3 py-1.5 rounded border text-xl">My Profile</Link>
                  <button onClick={() => { handleLogout(); setOpen(false); }} className="px-3 py-1.5 rounded border text-xl">Logout</button>
                </div>
              )}
              <Link href="/donation" onClick={() => setOpen(false)}>
                <Button className="px-3 py-1.5 text-xl">{t('donate')}</Button>
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}


