'use client';

import StatCard from '../../components/cards/StatCard';
import Button from '../../components/ui/Button';
import { useI18n } from '../../components/i18n/LanguageProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { getAllPrograms } from '../../services/programs';
// import { getAllActivities } from '@/services/activities';
import { getAllUsersPaginated } from '../../services/Users';
import { getAllDonations } from '../../services/donations';
import { getAllBlogs } from '../../services/blogs/api';
import { getAllGalleryItems } from '../../services/gallery';
import { getAllNotices } from '../../services/notices';
import { getVolunteerApplications } from '../../services/volunteers';
import { getMemberApplications } from '../../services/memberApplication';
import { toast } from 'sonner';

interface DashboardStats {
  totalPrograms: number;
  // totalActivities: number;
  totalUsers: number;
  totalDonations: number;
  totalDonationAmount: number;
  totalBlogs: number;
  totalGalleryItems: number;
  totalNotices: number;
  totalVolunteers: number;
  totalMembers: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  date?: string;
}

export default function DashboardPage(): React.ReactElement {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPrograms: 0,
    // totalActivities: 0,
    totalUsers: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
    totalBlogs: 0,
    totalGalleryItems: 0,
    totalNotices: 0,
    totalVolunteers: 0,
    totalMembers: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all statistics in parallel
        const [
          programsRes,
          // activitiesRes,
          usersRes,
          donationsRes,
          blogsRes,
          galleryRes,
          noticesRes,
          volunteersRes,
          membersRes,
        ] = await Promise.allSettled([
          getAllPrograms({ page: 1, limit: 1 }),
          // getAllActivities({ page: 1, limit: 1 }),
          getAllUsersPaginated({ page: 1, limit: 1 }),
          getAllDonations({ page: 1, limit: 1 }),
          getAllBlogs({ page: 1, limit: 1 }),
          getAllGalleryItems({ page: 1, limit: 1 }),
          getAllNotices({ page: 1, limit: 1 }),
          getVolunteerApplications({ page: 1, limit: 1 }),
          getMemberApplications({ page: 1, limit: 1 }),
        ]);

        const newStats: DashboardStats = {
          totalPrograms: programsRes.status === 'fulfilled' && programsRes.value.success
            ? (programsRes.value.pagination?.totalItems || programsRes.value.data?.length || 0)
            : 0,
          // totalActivities: activitiesRes.status === 'fulfilled' && activitiesRes.value.success
          //   ? (activitiesRes.value.pagination?.totalItems || activitiesRes.value.data?.length || 0)
          //   : 0,
          totalUsers: usersRes.status === 'fulfilled' && usersRes.value.success
            ? (usersRes.value.pagination?.totalItems || usersRes.value.data?.length || 0)
            : 0,
          totalDonations: donationsRes.status === 'fulfilled' && donationsRes.value.success
            ? (donationsRes.value.pagination?.total || donationsRes.value.data?.length || 0)
            : 0,
          totalDonationAmount: donationsRes.status === 'fulfilled' && donationsRes.value.success
            ? (donationsRes.value.totalDonationAmount || 0)
            : 0,
          totalBlogs: blogsRes.status === 'fulfilled' && blogsRes.value.success
            ? (blogsRes.value.pagination?.totalItems || blogsRes.value.data?.length || 0)
            : 0,
          totalGalleryItems: galleryRes.status === 'fulfilled' && galleryRes.value.success
            ? (galleryRes.value.pagination?.totalItems || galleryRes.value.data?.length || 0)
            : 0,
          totalNotices: noticesRes.status === 'fulfilled' && noticesRes.value.success
            ? (noticesRes.value.pagination?.totalItems || noticesRes.value.data?.length || 0)
            : 0,
          totalVolunteers: volunteersRes.status === 'fulfilled' && volunteersRes.value.success
            ? (volunteersRes.value.pagination?.totalItems || volunteersRes.value.data?.length || 0)
            : 0,
          totalMembers: membersRes.status === 'fulfilled' && membersRes.value.success
            ? (membersRes.value.pagination?.totalItems || membersRes.value.data?.length || 0)
            : 0,
        };

        setStats(newStats);

        // Fetch recent items
        const recentItemsData: RecentItem[] = [];
        
        // Get recent programs
        const recentPrograms = await getAllPrograms({ page: 1, limit: 5 });
        if (recentPrograms.success && recentPrograms.data) {
          recentPrograms.data.slice(0, 3).forEach((p: any) => {
            recentItemsData.push({
              id: p.id || p._id || '',
              title: p.title || '',
              type: 'program',
              date: p.createdAt || p.updatedAt,
            });
          });
        }

        // Get recent blogs
        const recentBlogs = await getAllBlogs({ page: 1, limit: 5 });
        if (recentBlogs.success && recentBlogs.data) {
          recentBlogs.data.slice(0, 3).forEach((b: any) => {
            recentItemsData.push({
              id: b.id || b._id || '',
              title: b.title || '',
              type: 'blog',
              date: b.date || b.createdAt,
            });
          });
        }

        // Get recent notices
        const recentNotices = await getAllNotices({ page: 1, limit: 5 });
        if (recentNotices.success && recentNotices.data) {
          recentNotices.data.slice(0, 3).forEach((n: any) => {
            recentItemsData.push({
              id: n.id || n._id || '',
              title: n.title || '',
              type: 'notice',
              date: n.date || n.createdAt,
            });
          });
        }

        // Sort by date and take most recent
        recentItemsData.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setRecentItems(recentItemsData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error(t('failedToLoadDashboard') || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboardData();
  }, [t]);

  const dashboardRoutes = [
    { href: '/dashboard/programs' as Route, label: t('programs') || 'Programs', icon: '📋', count: stats.totalPrograms },
    { href: '/dashboard/donation-categories' as Route, label: t('donationCategories') || 'Donation Categories', icon: '💰', count: 0 },
    { href: '/dashboard/donations' as Route, label: t('donations') || 'Donations', icon: '💵', count: stats.totalDonations },
    { href: '/dashboard/gallery' as Route, label: t('gallery') || 'Gallery', icon: '🖼️', count: stats.totalGalleryItems },
    { href: '/dashboard/notices' as Route, label: t('notice') || 'Notices', icon: '📢', count: stats.totalNotices },
    { href: '/dashboard/blogs' as Route, label: t('blog') || 'Blogs', icon: '📝', count: stats.totalBlogs },
    { href: '/dashboard/hero' as Route, label: t('heroImages') || 'Hero Images', icon: '🖼️', count: 0 },
    { href: '/dashboard/users' as Route, label: t('users') || 'Users', icon: '👥', count: stats.totalUsers },
    { href: '/dashboard/volunteers' as Route, label: t('volunteerApplications') || 'Volunteers', icon: '🤝', count: stats.totalVolunteers },
    { href: '/dashboard/members' as Route, label: t('memberApplications') || 'Members', icon: '👤', count: stats.totalMembers },
    { href: '/dashboard/admin-users/new' as Route, label: t('createAdmin') || 'Create Admin', icon: '➕', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard') || 'Dashboard'}</h1>
          <p className="text-gray-600 mt-1">{t('overviewOfActivity') || 'Overview of all activities and statistics'}</p>
        </div>
        <Link href="/dashboard/profile">
          <Button variant="secondary">{t('profile') || 'Profile'}</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('totalPrograms') || 'Total Programs'}
            value={stats.totalPrograms}
            hint={t('activePrograms') || 'Active programs'}
          />
          {/* <StatCard
            title={t('totalActivities') || 'Total Activities'}
            value={stats.totalActivities}
            hint={t('allActivities') || 'All activities'}
          /> */}
          <StatCard
            title={t('totalUsers') || 'Total Users'}
            value={stats.totalUsers}
            hint={t('registeredUsers') || 'Registered users'}
          />
          <StatCard
            title={t('totalDonations') || 'Total Donations'}
            value={stats.totalDonations}
            hint={t('allDonations') || 'All donations'}
          />
          <StatCard
            title={t('donationAmount') || 'Donation Amount'}
            value={formatCurrency(stats.totalDonationAmount)}
            hint={t('totalRaised') || 'Total raised'}
          />
          <StatCard
            title={t('totalActivities') || 'Total Blogs'}
            value={stats.totalBlogs}
            hint={t('allActivities') || 'Blog posts'}
          />
          <StatCard
            title={t('totalGallery') || 'Gallery Items'}
            value={stats.totalGalleryItems}
            hint={t('mediaItems') || 'Media items'}
          />
          <StatCard
            title={t('totalNotices') || 'Total Notices'}
            value={stats.totalNotices}
            hint={t('announcements') || 'Announcements'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{t('quickLinks') || 'Quick Links'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dashboardRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{route.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{route.label}</div>
                      {route.count > 0 && (
                        <div className="text-sm text-gray-500">{route.count} {t('items') || 'items'}</div>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('recentActivity') || 'Recent Activity'}</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div key={item.id} className="pb-3 border-b last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {item.type}
                        </span>
                        {item.date && (
                          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('noRecentActivity') || 'No recent activity'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('applications') || 'Applications'}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('volunteerApplications') || 'Volunteer Applications'}</span>
              <span className="font-semibold">{stats.totalVolunteers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('memberApplications') || 'Member Applications'}</span>
              <span className="font-semibold">{stats.totalMembers}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{t('content') || 'Content'}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('programs') || 'Programs'}</span>
              <span className="font-semibold">{stats.totalPrograms}</span>
            </div>
            {/* <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('activities') || 'Activities'}</span>
              <span className="font-semibold">{stats.totalActivities}</span>
            </div> */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('blog') || 'Blogs'}</span>
              <span className="font-semibold">{stats.totalBlogs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('gallery') || 'Gallery'}</span>
              <span className="font-semibold">{stats.totalGalleryItems}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


