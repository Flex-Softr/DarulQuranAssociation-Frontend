'use client';

import React, { useMemo, useState } from 'react';
import Select, { SelectOption } from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { useI18n } from '../../components/i18n/LanguageProvider';

type Donation = {
	_id: string;
	amount: number;
	method?: string;
	reference?: string;
	status?: string;
	purpose?: string;
	tran_id?: string;
	createdAt: string;
	[key: string]: any;
};

const ITEMS_PER_PAGE = 10;

function PaginationControls({
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}): React.ReactElement {
	const { t } = useI18n();
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const siblings = 1;
		const first = 1;
		const last = totalPages;
		const start = Math.max(first, currentPage - siblings);
		const end = Math.min(last, currentPage + siblings);

		if (start > first) {
			pages.push(first);
			if (start > first + 1) pages.push('…');
		}
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		if (end < last) {
			if (end < last - 1) pages.push('…');
			pages.push(last);
		}

		return pages;
	};

	return (
		<div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
					<div className="flex flex-1 justify-between sm:hidden">
						<button
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage <= 1}
							className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{t('previous')}
						</button>
						<button
							onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage >= totalPages}
							className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{t('next')}
						</button>
					</div>
			<div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
				<div>
					<p className="text-sm text-gray-700">
						{t('showing')} <span className="font-medium">
							{totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
						</span> {t('to')}{' '}
						<span className="font-medium">
							{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
						</span>{' '}
						{t('of')} <span className="font-medium">{totalItems}</span> {t('results')}
					</p>
				</div>
				<div>
					<nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
						<button
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage <= 1}
							className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span className="sr-only">Previous</span>
							<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fillRule="evenodd"
									d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
						{getPageNumbers().map((page, idx) =>
							typeof page === 'number' ? (
								<button
									key={idx}
									onClick={() => onPageChange(page)}
									aria-current={page === currentPage ? 'page' : undefined}
									className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
										page === currentPage
											? 'z-10 bg-brand text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
											: 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
									}`}
								>
									{page}
								</button>
							) : (
								<span
									key={idx}
									className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
								>
									{page}
								</span>
							)
						)}
						<button
							onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage >= totalPages}
							className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span className="sr-only">Next</span>
							<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fillRule="evenodd"
									d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</nav>
				</div>
			</div>
		</div>
	);
}

function getStatusBadgeClass(status: string): string {
	const statusLower = status.toLowerCase();
	if (statusLower.includes('success') || statusLower.includes('completed') || statusLower === 'success') {
		return 'bg-green-100 text-green-800';
	}
	if (statusLower.includes('pending') || statusLower === 'pending') {
		return 'bg-yellow-100 text-yellow-800';
	}
	if (statusLower.includes('failed') || statusLower.includes('cancel') || statusLower === 'failed') {
		return 'bg-red-100 text-red-800';
	}
	return 'bg-gray-100 text-gray-800';
}

export default function DonationsTable({
	donations,
	loading,
}: {
	donations: Donation[];
	loading: boolean;
}): React.ReactElement {
	const { t, lang } = useI18n();
	const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
	const [currentPage, setCurrentPage] = useState(1);
	const [filterPurpose, setFilterPurpose] = useState<string>('');
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [filterDateFrom, setFilterDateFrom] = useState<string>('');
	const [filterDateTo, setFilterDateTo] = useState<string>('');

	// Get unique purposes and statuses for filter options
	const uniquePurposes = useMemo(() => {
		const purposes = new Set<string>();
		donations.forEach((d) => {
			if (d.purpose) purposes.add(d.purpose);
		});
		return Array.from(purposes).sort();
	}, [donations]);

	const uniqueStatuses = useMemo(() => {
		const statuses = new Set<string>();
		donations.forEach((d) => {
			if (d.status) statuses.add(d.status);
		});
		return Array.from(statuses).sort();
	}, [donations]);

	// Filter donations
	const filteredDonations = useMemo(() => {
		return donations.filter((d) => {
			// Purpose filter
			if (filterPurpose && d.purpose !== filterPurpose) return false;

			// Status filter
			if (filterStatus && d.status !== filterStatus) return false;

			// Date filters
			if (filterDateFrom || filterDateTo) {
				const donationDate = new Date(d.createdAt);
				donationDate.setHours(0, 0, 0, 0);

				if (filterDateFrom) {
					const fromDate = new Date(filterDateFrom);
					fromDate.setHours(0, 0, 0, 0);
					if (donationDate < fromDate) return false;
				}

				if (filterDateTo) {
					const toDate = new Date(filterDateTo);
					toDate.setHours(23, 59, 59, 999);
					if (donationDate > toDate) return false;
				}
			}

			return true;
		});
	}, [donations, filterPurpose, filterStatus, filterDateFrom, filterDateTo]);

	// Paginate filtered donations
	const paginatedDonations = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredDonations.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredDonations, currentPage]);

	const totalPages = Math.max(1, Math.ceil(filteredDonations.length / ITEMS_PER_PAGE));

	// Reset to page 1 when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [filterPurpose, filterStatus, filterDateFrom, filterDateTo]);

	const purposeOptions: SelectOption[] = [
		{ value: '', label: t('allPurposes') },
		...uniquePurposes.map((p) => ({ value: p, label: p })),
	];

	const statusOptions: SelectOption[] = [
		{ value: '', label: t('allStatuses') },
		...uniqueStatuses.map((s) => ({ value: s, label: s })),
	];

	if (loading) {
		return (
			<div className="rounded-xl border border-gray-200 bg-white p-8">
				<div className="flex items-center justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
					<span className="ml-3 text-gray-600">{t('loadingDonations')}</span>
				</div>
			</div>
		);
	}

	if (!donations || donations.length === 0) {
		return (
			<div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
				<p className="text-gray-600">{t('noDonationRecords')}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">{t('filterDonations')}</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<Select
							id="filter-purpose"
							label={t('purpose')}
							options={purposeOptions}
							value={filterPurpose}
							onChange={(e) => setFilterPurpose(e.target.value)}
							className="text-sm"
						/>
					</div>
					<div>
						<Select
							id="filter-status"
							label={t('status')}
							options={statusOptions}
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="text-sm"
						/>
					</div>
					<div>
						<Input
							id="filter-date-from"
							type="date"
							label={t('dateFrom')}
							value={filterDateFrom}
							onChange={(e) => setFilterDateFrom(e.target.value)}
							className="text-sm h-10"
						/>
					</div>
					<div>
						<Input
							id="filter-date-to"
							type="date"
							label={t('dateTo')}
							value={filterDateTo}
							onChange={(e) => setFilterDateTo(e.target.value)}
							className="text-sm h-10"
						/>
					</div>
				</div>
				{(filterPurpose || filterStatus || filterDateFrom || filterDateTo) && (
					<div className="mt-4 flex items-center gap-2">
						<button
							onClick={() => {
								setFilterPurpose('');
								setFilterStatus('');
								setFilterDateFrom('');
								setFilterDateTo('');
							}}
							className="text-sm text-brand hover:text-brand/80 font-medium"
						>
							{t('clearAllFilters')}
						</button>
						<span className="text-sm text-gray-500">
							({filteredDonations.length} {filteredDonations.length === 1 ? t('result') : t('results')})
						</span>
					</div>
				)}
			</div>

			{/* Table */}
			<div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gradient-to-r from-gray-50 to-gray-100">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('date')}
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('amount')}
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('purpose')}
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('reference')}
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('transactionId')}
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
									{t('status')}
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{paginatedDonations.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
										{t('noDonationsMatch')}
									</td>
								</tr>
							) : (
								paginatedDonations.map((d) => (
									<tr
										key={d._id}
										className="hover:bg-gray-50 transition-colors duration-150"
									>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{new Date(d.createdAt).toLocaleDateString(locale, {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
											৳{d.amount.toLocaleString()}
										</td>
										<td className="px-6 py-4 text-sm text-gray-700">
											{d.purpose || <span className="text-gray-400">-</span>}
										</td>
										<td className="px-6 py-4 text-sm text-gray-700">
											{d.reference || <span className="text-gray-400">-</span>}
										</td>
										<td className="px-6 py-4 text-sm font-mono text-gray-600">
											{d.tran_id || <span className="text-gray-400">-</span>}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{d.status ? (
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
														d.status
													)}`}
												>
													{d.status}
												</span>
											) : (
												<span className="text-gray-400">-</span>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<PaginationControls
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={filteredDonations.length}
						onPageChange={setCurrentPage}
					/>
				)}
			</div>
		</div>
	);
}


