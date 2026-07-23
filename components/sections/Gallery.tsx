'use client';

import * as React from 'react';
import Container from '../layout/Container';
import { config } from '../../config';
import { getImageUrl } from '../../lib/imageUtils';
import { useI18n } from '../i18n/LanguageProvider';
import Link from 'next/link';
import Button from '../ui/Button';

type GalleryItem = { id: string; src: string; alt?: string; type?: 'image' | 'video' };

const getYoutubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.replace('/embed/', '') || null;
      }
      return parsed.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
};

const getYoutubeThumbnail = (url: string): string | null => {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const getYoutubeEmbedUrl = (url: string): string => {
  const id = getYoutubeVideoId(url);
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
};

const isVideoItem = (item?: GalleryItem): boolean => {
  if (!item) return false;
  if ((item.type ?? 'image') === 'video') return true;
  return Boolean(getYoutubeVideoId(item.src));
};

export default function Gallery({ items, fetchCount = 6, show=true }: { items?: ReadonlyArray<GalleryItem>; fetchCount?: number; show?: boolean }): React.ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = React.useState<boolean>(false);
  const [index, setIndex] = React.useState<number>(0);
  const [fetched, setFetched] = React.useState<GalleryItem[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const FIXED_TOKEN = "f3a1d9c6b87e4f209ad4c0c8c1f5e92e3b6a7c4de2af41b0c8f5a6d2c917eb3a"
  // Load public gallery items if no items provided
  React.useEffect(() => {
    let canceled = false;
    async function load() {
      if (items && items.length > 0) return;
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set('page', '1');
        qs.set('limit', String(fetchCount));
        qs.set('type', 'image');
        const resp = await fetch(`${config.api.baseUrl}/gallery?${qs.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: FIXED_TOKEN },
          next: { tags: ['gallery'] } as any,
        });
        if (!resp.ok) throw new Error(`Gallery public fetch failed: ${resp.status}`);
        const data = await resp.json();
        const list: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const mapped: GalleryItem[] = list
          .slice(0, fetchCount)
          .map((it) => {
            const rawSrc = it.media ?? it.src ?? it.url ?? it.image ?? it.thumbnail ?? '';
            const declaredType = (it.type as GalleryItem['type']) ?? undefined;
            const inferredType: GalleryItem['type'] = declaredType ?? (getYoutubeVideoId(rawSrc) ? 'video' : 'image');
            return {
              id: String(it.id ?? it._id ?? ''),
              src: inferredType === 'video' ? rawSrc : getImageUrl(rawSrc),
              alt: it.title ?? it.caption ?? '',
              type: inferredType,
            };
          })
          .filter((it) => it.src);
        if (!canceled) setFetched(mapped);
      } catch {
        if (!canceled) setFetched([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onOpen = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const onClose = () => setOpen(false);
  // Limit display to 6 items regardless of source size
  const displayItems = React.useMemo(() => (fetched ?? items ?? []).slice(0, 6), [fetched, items]);
  const prev = () => setIndex((i) => (i - 1 + displayItems.length) % displayItems.length);
  const next = () => setIndex((i) => (i + 1) % displayItems.length);
  const activeItem = displayItems[index];
  const isActiveVideo = isVideoItem(activeItem);

  return (
    <>

     <Container>
      {isActiveVideo ? (
        <h2 className="text-4xl sm:text-5xl font-extrabold text-emerald-900 my-20 text-center">{t('gallery')}</h2>
      ) : (
        <h2 className="text-4xl sm:text-5xl font-extrabold text-emerald-900 my-20 text-center">{t('gallery')}</h2>
      )}
    {/* <h2 className="text-4xl sm:text-5xl font-extrabold text-emerald-900 my-20 text-center">{t('gallery')}</h2> */}
     <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6 md:gap-8">
        {displayItems.map((it, i) => {
          const isVideo = isVideoItem(it);
          const previewSrc = isVideo ? getYoutubeThumbnail(it.src) ?? '' : it.src ?? '';
          return (
           // console.log("previewSrc", previewSrc),
            <button
              key={it.id}
              onClick={() => onOpen(i)}
              className="group relative block rounded-2xl overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc ?? ''}
                alt={it.alt || ''}
                className="h-48 sm:h-56 md:h-60 w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition" />
              {/* Eye overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-white/95 text-gray-800 flex items-center justify-center shadow-lg">
                  {isVideo ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M8 5.14a1 1 0 0 1 1.52-.85l9 6a1 1 0 0 1 0 1.72l-9 6A1 1 0 0 1 8 18.14Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                      <path
                        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {show && (
      <div className="mt-8 flex justify-center">
          <Link href="/gallery">
            <Button className="px-6">{t('readMore')}</Button>
          </Link>
        </div>
        )}
     </Container>

        {/* Modal */}
        {open && activeItem ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative max-w-4xl w-full">
                {isActiveVideo ? (
                  <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
                    <iframe
                      key={activeItem.id}
                      src={getYoutubeEmbedUrl(activeItem.src)}
                      title={activeItem.alt || activeItem.id}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeItem.src} alt={activeItem.alt || ''} className="w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
                )}
                <button aria-label="Close" onClick={onClose} className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white text-gray-700 shadow">✕</button>
                <button aria-label="Prev" onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white text-gray-700 shadow">‹</button>
                <button aria-label="Next" onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-10 w-10 rounded-full bg-white text-gray-700 shadow">›</button>
              </div>
            </div>
          </div>
        ) : null}
    </>
  );
}


