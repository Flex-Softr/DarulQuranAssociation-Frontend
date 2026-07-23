'use client';

import React from 'react';
import { useEffect, useState, useCallback, Fragment } from 'react';
import Button from '../../../components/ui/Button';
import { Donation, getAllDonations } from '../../../services/donations';
import { toast } from 'sonner';
import { useI18n } from '../../../components/i18n/LanguageProvider';

export default function DonationsPage(): React.ReactElement {
  const { t, lang } = useI18n();
  const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonationAmount, setTotalDonationAmount] = useState(0);
  
  // Filter states - single search field for purpose, transaction ID, and contact
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const loadDonations = async (page?: number, limit?: number) => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        tran_id?: string;
        purpose?: string;
        contact?: string;
        startDate?: string;
        endDate?: string;
      } = {
        page: page ?? currentPage,
        limit: limit ?? itemsPerPage,
      };

      // Use search term - send to tran_id field
      // Note: If backend needs to search across multiple fields (tran_id, contact, purpose),
      // the backend controller should be updated to support OR logic or a general search parameter
      if (searchTerm.trim()) {
        params.tran_id = searchTerm.trim();
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await getAllDonations(params);
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setDonations(data);
        
        // Update pagination info from API response
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.totalPages || 1);
          setCurrentPage(response.pagination.page || 1);
        }
        
        // Update total donation amount from API response
        if (response.totalDonationAmount !== undefined) {
          setTotalDonationAmount(response.totalDonationAmount);
        }
      } else {
        toast.error(response.message ?? t('operationFailed'));
        setDonations([]);
        setTotalItems(0);
        setTotalPages(1);
        setTotalDonationAmount(0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
      setDonations([]);
      setTotalItems(0);
      setTotalPages(1);
      setTotalDonationAmount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load donations on mount and when pagination changes
  useEffect(() => {
    void loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // Use setTimeout to ensure state updates are applied before reloading
    setTimeout(() => void loadDonations(1, itemsPerPage), 0);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    // Use setTimeout to ensure state updates are applied before reloading
    setTimeout(() => void loadDonations(1, itemsPerPage), 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('notAvailable');
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || 'completed';
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        {statusLower === 'completed' ? t('completed') || 'Completed' : status || t('completed') || 'Completed'}
      </span>
    );
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const isRowExpanded = (id: string) => expandedRows.includes(id);

  const getDonationId = (donation: Donation, index: number): string => {
    return donation.id || donation.transactionId || (donation as any).tran_id || `donation-${index}`;
  };

  const formatFieldValue = (value?: string | number | boolean | null) => {
    if (value === undefined || value === null || value === '') {
      return t('notAvailable') || 'N/A';
    }
    if (typeof value === 'boolean') {
      return value ? t('yes') || 'Yes' : t('no') || 'No';
    }
    return value;
  };

  const renderDetailSections = (donation: Donation) => {
    const sections = [
      {
        title: t('donationInformation') || 'Donation Information',
        fields: [
          { label: t('transactionId') || 'Transaction ID', value: donation.transactionId || (donation as any).tran_id },
          { label: t('purpose') || 'Purpose', value: donation.purpose },
          { label: t('contact') || 'Contact', value: donation.contact },
          { label: t('amount') || 'Amount', value: formatCurrency(donation.amount || 0) },
          { label: t('status') || 'Status', value: donation.status || 'completed' },
        ],
      },
      {
        title: t('transactionDetails') || 'Transaction Details',
        fields: [
          { label: t('createdAt') || 'Created At', value: formatDate(donation.createdAt) },
          { label: t('updatedAt') || 'Updated At', value: formatDate(donation.updatedAt) },
          { label: t('donationId') || 'Donation ID', value: donation.id },
        ],
      },
    ];

    // Add gateway data if available
    if (donation.gatewayData && Object.keys(donation.gatewayData).length > 0) {
      sections.push({
        title: t('gatewayData') || 'Payment Gateway Data',
        fields: Object.entries(donation.gatewayData).map(([key, value]) => ({
          label: key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        })),
      });
    }

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">{section.title}</h4>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field) => (
                <div key={field.label} className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{field.label}</p>
                  <p className="mt-1 text-sm text-gray-900">{formatFieldValue(field.value)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('donations') || 'Donations'}</h1>
          <p className="text-gray-600">{t('manageDonations') || 'View and manage all donations'}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('search') || 'Search'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchDonations') || 'Search by Transaction ID, Contact, or Purpose...'}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('startDate') || 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('endDate') || 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{t('search') || 'Search'}</Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                {t('reset') || 'Reset'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">{t('totalDonations') || 'Total Donations'}</div>
          <div className="text-2xl font-bold text-emerald-700">{totalItems}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">{t('totalAmount') || 'Total Amount'}</div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalDonationAmount)}</div>
        </div>
        {/* <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">{t('completedDonations') || 'Completed'}</div>
          <div className="text-2xl font-bold text-emerald-700">{donations.length}</div>
        </div> */}
      </div>

      {/* Donations Table */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold mb-3">{t('donationsList') || 'Donations List'}</h3>
        {loading ? (
          <div className="py-8 text-center text-gray-500">{t('loading') || 'Loading...'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">{t('transactionId') || 'Transaction ID'}</th>
                  <th className="py-3 pr-4">{t('contact') || 'Contact'}</th>
                  <th className="py-3 pr-4">{t('purpose') || 'Purpose'}</th>
                  <th className="py-3 pr-4">{t('amount') || 'Amount'}</th>
                  <th className="py-3 pr-4">{t('status') || 'Status'}</th>
                  <th className="py-3 pr-4">{t('date') || 'Date'}</th>
                  <th className="py-3 pr-4">{t('details') || 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      {t('noDonationsFound') || 'No donations found'}
                    </td>
                  </tr>
                ) : (
                  donations.map((donation, index) => {
                    const donationId = getDonationId(donation, index);
                    const expanded = isRowExpanded(donationId);
                    return (
                      <Fragment key={donationId}>
                        <tr className="border-t hover:bg-gray-50">
                          <td className="py-3 pr-4 font-mono text-xs">
                            {donation.transactionId || (donation as any).tran_id || t('notAvailable') || 'N/A'}
                          </td>
                          <td className="py-3 pr-4">{donation.contact || t('notAvailable') || 'N/A'}</td>
                          <td className="py-3 pr-4">
                            <span className="max-w-xs truncate block" title={donation.purpose}>
                              {donation.purpose || t('notAvailable') || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-emerald-700">
                            {formatCurrency(donation.amount || 0)}
                          </td>
                          <td className="py-3 pr-4">{getStatusBadge(donation.status)}</td>
                          <td className="py-3 pr-4 text-gray-600">{formatDate(donation.createdAt)}</td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() => toggleRowExpansion(donationId)}
                              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              aria-label={expanded ? t('hide') || 'Hide details' : t('expand') || 'Show details'}
                            >
                              {expanded ? (
                                <svg
                                  className="w-5 h-5 text-emerald-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="border-t bg-gray-50/70">
                            <td colSpan={7} className="p-4">
                              {renderDetailSections(donation)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('show') || 'Show'}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">{t('perPage') || 'per page'}</span>
          </div>

          <div className="text-sm text-gray-600">
            {t('showing') || 'Showing'} {(currentPage - 1) * itemsPerPage + 1} {t('to') || 'to'}{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} {t('of') || 'of'}{' '}
            {totalItems} {t('donations') || 'donations'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('previous') || 'Previous'}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, idx, arr) => (
                  <div key={page} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </div>
                ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('next') || 'Next'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}