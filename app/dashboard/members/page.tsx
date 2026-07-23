'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Button from '../../../components/ui/Button';
import { useI18n, useTranslateEnum } from '../../../components/i18n/LanguageProvider';
import {
	getMemberApplications,
	updateMemberApplicationStatus,
	updateMemberApplicationPaymentStatus,
	deleteMemberApplication,
	MemberApplication
} from '../../../services/memberApplication';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/imageUtils';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
}

interface DetailField {
	label: string;
	value?: string | number | boolean;
	content?: React.ReactNode;
}

interface DetailSection {
	title: string;
	fields: DetailField[];
}

export default function MembersPage(): React.ReactElement {
	const { t, lang } = useI18n();
	const confirmDialog = useConfirmDialog();
	const translateEnum = useTranslateEnum();
	const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
	const [applications, setApplications] = useState<MemberApplication[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all');
	const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'completed' | 'pending_verification' | 'failed'>('all');
	const [typeFilter, setTypeFilter] = useState<'all' | 'lifetime' | 'donor'>('all');
	const [expandedRows, setExpandedRows] = useState<string[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo>({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
		itemsPerPage: 10,
	});

	const loadApplications = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getMemberApplications({
				page: currentPage,
				limit: pagination.itemsPerPage,
				status: statusFilter !== 'all' ? statusFilter : undefined,
				paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
				type: typeFilter !== 'all' ? typeFilter : undefined,
				searchTerm: searchTerm || undefined,
			});

			if (response.success && response.data) {
				setApplications(response.data);
				if (response.pagination) {
					setPagination(response.pagination);
				}
			} else {
				toast.error(response.message || t('fetchMembersFailure'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			toast.error(message || t('fetchMembersFailure'));
		} finally {
			setLoading(false);
		}
	}, [currentPage, searchTerm, statusFilter, paymentStatusFilter, typeFilter, pagination.itemsPerPage, t]);

	useEffect(() => {
		loadApplications();
	}, [loadApplications]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		loadApplications();
	};

	const handleStatusChange = async (id: string, newStatus: 'pending_approval' | 'approved' | 'rejected') => {
		try {
			const response = await updateMemberApplicationStatus(id, newStatus);
			if (response.success) {
				toast.success(t('memberStatusUpdateSuccess'));
				loadApplications();
			} else {
				toast.error(response.message || t('memberStatusUpdateFailure'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			toast.error(message || t('memberStatusUpdateFailure'));
		}
	};

	const handlePaymentStatusChange = async (id: string, newPaymentStatus: 'pending' | 'completed' | 'pending_verification' | 'failed') => {
		try {
			const response = await updateMemberApplicationPaymentStatus(id, newPaymentStatus);
			if (response.success) {
				toast.success(t('memberPaymentStatusUpdateSuccess') || t('memberStatusUpdateSuccess'));
				loadApplications();
			} else {
				toast.error(response.message || t('memberPaymentStatusUpdateFailure') || t('memberStatusUpdateFailure'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			toast.error(message || t('memberPaymentStatusUpdateFailure') || t('memberStatusUpdateFailure'));
		}
	};

	const handleDelete = async (id: string) => {
		const confirmed = await confirmDialog({
			title: t('delete'),
			description: t('memberDeleteConfirm'),
			confirmText: t('delete'),
			cancelText: t('cancel'),
			confirmVariant: 'danger',
		});
		if (!confirmed) return;

		try {
			const response = await deleteMemberApplication(id);
			if (response.success) {
				toast.success(t('memberDeleteSuccess'));
				loadApplications();
			} else {
				toast.error(response.message || t('memberDeleteFailure'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : '';
			toast.error(message || t('memberDeleteFailure'));
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale).format(amount);
	};

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'rejected':
				return 'bg-red-100 text-red-800';
			case 'pending_approval':
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'completed':
				return 'bg-blue-100 text-blue-800';
			case 'pending_verification':
				return 'bg-orange-100 text-orange-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getPaymentStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'pending_verification':
				return 'bg-orange-100 text-orange-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const toggleRowExpansion = (id: string) => {
		setExpandedRows((prev) =>
			prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
		);
	};

	const isRowExpanded = (id: string) => expandedRows.includes(id);

	const formatFieldValue = (value?: string | number | boolean) => {
		if (value === undefined || value === null || value === '') {
			return t('notAvailable');
		}
		if (typeof value === 'boolean') {
			return value ? t('yes') : t('no');
		}
		if (typeof value === 'number') {
			return formatAmount(value);
		}
		return value;
	};

	const renderDetailSections = (application: MemberApplication) => {
		const sections: DetailSection[] = [
			{
				title: t('personalInformation'),
				fields: [
					{ label: t('name'), value: application.name },
					{ label: t('fatherName'), value: application.fatherName },
					{ label: t('gender'), value: application.gender === 'male' ? t('male') : t('female') },
					{ label: t('mobile'), value: application.mobile },
					{ label: t('email'), value: application.email },
					{ label: t('isOverseas'), value: application.isOverseas },
					{ label: t('occupation'), value: application.district },
					{ label: t('reference'), value: application.reference },
					{ label: t('address'), value: application.address },
				],
			},
			{
				title: t('applicationDetails'),
				fields: [
					{ label: t('memberType'), value: getTypeLabel(application.type) },
					{ label: t('amount'), value: `৳${formatAmount(application.amount)}` },
					{ label: t('applicationStatus'), value: getApplicationStatusLabel(application.applicationStatus) },
					{ label: t('paymentMethod'), value: getPaymentMethodLabel(application.paymentMethod) },
					{ label: t('paymentStatus'), value: getPaymentStatusLabel(application.paymentStatus) },
					{ label: t('transactionId'), value: application.transactionId || application.tran_id },
					{ label: t('appliedAt'), value: formatDate(application.createdAt) },
					{ label: t('lastUpdated'), value: formatDate(application.updatedAt) },
				],
			},
		];

		// Add payment document section if available
		if (application.paymentDocument) {
			sections.push({
				title: t('paymentDocument'),
				fields: [
					{
						label: t('document'),
						content: (
							<div className="flex items-center gap-3">
								<a
									href={getImageUrl(application.paymentDocument!)}
									target="_blank"
									rel="noreferrer"
									className="text-sm font-medium text-emerald-600 hover:underline"
								>
									{t('viewPaymentDocument')}
								</a>
							</div>
						),
					},
				],
			});
		}

		// Add SSLCommerz data if available
		if (application.sslcommerzData && Object.keys(application.sslcommerzData).length > 0) {
			sections.push({
				title: t('paymentGatewayDetails'),
				fields: [
					{ label: t('validationId'), value: application.sslcommerzValId },
					...Object.entries(application.sslcommerzData).map(([key, value]) => ({
						label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
						value: String(value),
					})),
				],
			});
		}

		return (
			<div className="space-y-6">
				{sections.map((section) => (
					<div key={section.title} className="space-y-3">
						<h4 className="text-sm font-semibold text-gray-700">{section.title}</h4>
						<div className="grid gap-3 md:grid-cols-2">
							{section.fields.map((field, idx) => (
								<div key={field.label || idx} className="rounded-lg border bg-gray-50 p-3">
									<p className="text-xs font-medium uppercase tracking-wide text-gray-500">{field.label}</p>
									{field.content ? (
										<div className="mt-1">{field.content}</div>
									) : (
										<p className="mt-1 text-sm text-gray-900">{formatFieldValue(field.value)}</p>
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		);
	};

	// Use the utility function for translating enum values
	const getApplicationStatusLabel = (status: string) => translateEnum(status);
	const getPaymentStatusLabel = (status: string) => translateEnum(status);
	const getTypeLabel = (type: 'lifetime' | 'donor') => translateEnum(type);
	const getPaymentMethodLabel = (method: string) => translateEnum(method);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{t('memberApplications')}</h1>
					<p className="text-gray-600">{t('memberApplicationsDescription')}</p>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="rounded-2xl border bg-white p-4 shadow-sm">
				<form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder={t('memberSearchPlaceholder')}
							className="w-full rounded-lg border px-3 py-2"
						/>
					</div>
					<div>
						<select
							value={typeFilter}
							onChange={(e) => {
								setTypeFilter(e.target.value as 'all' | 'lifetime' | 'donor');
								setCurrentPage(1);
							}}
							className="w-full md:w-auto rounded-lg border px-3 py-2"
						>
							<option value="all">{t('allTypes')}</option>
							<option value="lifetime">{t('lifetimeMemberType')}</option>
							<option value="donor">{t('donorMemberType')}</option>
						</select>
					</div>
					<div>
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value as 'all' | 'pending_approval' | 'approved' | 'rejected');
								setCurrentPage(1);
							}}
							className="w-full md:w-auto rounded-lg border px-3 py-2"
						>
							<option value="all">{t('allStatus')}</option>
							<option value="pending_approval">{t('pendingApproval')}</option>
							<option value="approved">{t('approved')}</option>
							<option value="rejected">{t('rejected')}</option>
						</select>
					</div>
					<div>
						<select
							value={paymentStatusFilter}
							onChange={(e) => {
								setPaymentStatusFilter(e.target.value as 'all' | 'pending' | 'completed' | 'pending_verification' | 'failed');
								setCurrentPage(1);
							}}
							className="w-full md:w-auto rounded-lg border px-3 py-2"
						>
							<option value="all">{t('allPaymentStatus')}</option>
							<option value="pending">{t('pending')}</option>
							<option value="completed">{t('completed')}</option>
							<option value="pending_verification">{t('pendingVerification')}</option>
							<option value="failed">{t('failed')}</option>
						</select>
					</div>
					<Button type="submit">{t('search')}</Button>
				</form>
			</div>

			{/* Applications Table */}
			<div className="rounded-2xl border bg-white p-4 shadow-sm">
				{loading ? (
					<div className="py-8 text-center text-gray-500">{t('loading')}</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-gray-500 border-b">
										<th className="py-3 pr-4">{t('name')}</th>
										<th className="py-3 pr-4">{t('memberTableType')}</th>
										<th className="py-3 pr-4">{t('memberTableAmount')}</th>
										<th className="py-3 pr-4">{t('mobile')}</th>
										<th className="py-3 pr-4">{t('memberTablePaymentStatus')}</th>
										<th className="py-3 pr-4">{t('memberTableStatus')}</th>
										<th className="py-3 pr-4">{t('memberTableAppliedDate')}</th>
										<th className="py-3 pr-4">{t('memberTablePaymentStatusActions')}</th>
										<th className="py-3 pr-4">{t('memberTableStatusActions')}</th>
										<th className="py-3 pr-4">{t('memberTableDetails')}</th>
										<th className="py-3 pr-4">{t('memberTableActions')}</th>
									</tr>
								</thead>
								<tbody>
									{applications.length === 0 ? (
										<tr>
											<td colSpan={11} className="py-8 text-center text-gray-500">
												{t('noMemberApplications')}
											</td>
										</tr>
									) : (
										applications.map((application) => (
											<Fragment key={application._id}>
												<tr className="border-t">
													<td className="py-3 pr-4 font-medium">{application.name}</td>
													<td className="py-3 pr-4">
														<span className={`px-2 py-1 rounded-full text-xs ${
															application.type === 'lifetime' 
																? 'bg-purple-100 text-purple-800' 
																: 'bg-blue-100 text-blue-800'
														}`}>
															{getTypeLabel(application.type)}
														</span>
													</td>
													<td className="py-3 pr-4 font-semibold">৳{formatAmount(application.amount)}</td>
													<td className="py-3 pr-4">{application.mobile}</td>
													<td className="py-3 pr-4">
														<span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusBadgeClass(application.paymentStatus)}`}>
															{getPaymentStatusLabel(application.paymentStatus)}
														</span>
													</td>
													<td className="py-3 pr-4">
														<span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(application.applicationStatus)}`}>
															{getApplicationStatusLabel(application.applicationStatus)}
														</span>
													</td>
													<td className="py-3 pr-4">{formatDate(application.createdAt)}</td>
													<td className="py-3 pr-4">
														<select
															value={application.paymentStatus}
															onChange={(e) => handlePaymentStatusChange(application._id, e.target.value as 'pending' | 'completed' | 'pending_verification' | 'failed')}
															className="w-full rounded-lg border px-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
														>
															<option value="pending">{t('pending')}</option>
															<option value="completed">{t('completed')}</option>
															<option value="pending_verification">{t('pendingVerification')}</option>
															<option value="failed">{t('failed')}</option>
														</select>
													</td>
													<td className="py-3 pr-4">
														<select
															value={application.applicationStatus}
															onChange={(e) => handleStatusChange(application._id, e.target.value as 'pending_approval' | 'approved' | 'rejected')}
															className="w-full rounded-lg border px-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
														>
															<option value="pending_approval">{t('pendingApproval')}</option>
															<option value="approved">{t('approved')}</option>
															<option value="rejected">{t('rejected')}</option>
														</select>
													</td>
													<td className="py-3 pr-4">
														<button
															onClick={() => toggleRowExpansion(application._id)}
															className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
															aria-label={isRowExpanded(application._id) ? t('hide') || 'Hide details' : t('expand') || 'Show details'}
														>
															{isRowExpanded(application._id) ? (
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
													<td className="py-3 pr-4">
														<Button
															onClick={() => handleDelete(application._id)}
															variant="danger"
															size="sm"
														>
															{t('delete')}
														</Button>
													</td>
												</tr>
												{isRowExpanded(application._id) && (
													<tr className="border-t bg-gray-50/70">
														<td colSpan={11} className="p-4">
															{renderDetailSections(application)}
														</td>
													</tr>
												)}
											</Fragment>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{pagination.totalPages > 1 && (
							<div className="mt-4 flex items-center justify-between">
								<div className="text-sm text-gray-600">
									{t('showing')}{' '}
									{(currentPage - 1) * pagination.itemsPerPage + 1}{' '}
									{t('to')}{' '}
									{Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)}{' '}
									{t('of')}{' '}
									{pagination.totalItems}{' '}
									{t('applications')}
								</div>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										{t('previous')}
									</Button>
									<div className="flex items-center gap-1">
										{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
											.filter(
												(page) =>
													page === 1 ||
													page === pagination.totalPages ||
													(page >= currentPage - 1 && page <= currentPage + 1)
											)
											.map((page, idx, arr) => (
												<div key={page} className="flex items-center gap-1">
													{idx > 0 && arr[idx - 1] !== page - 1 && (
														<span className="px-2">...</span>
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
										onClick={() =>
											setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
										}
										disabled={currentPage === pagination.totalPages}
									>
										{t('next')}
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}

