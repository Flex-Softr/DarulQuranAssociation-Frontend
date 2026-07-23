'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Button from '../../../components/ui/Button';
import { 
	getVolunteerApplications, 
	updateVolunteerApplicationStatus, 
	deleteVolunteerApplication,
	VolunteerApplication 
} from '../../../services/volunteers';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/imageUtils';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { config } from '../../../config';

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

export default function VolunteersPage(): React.ReactElement {
	const { t, lang } = useI18n();
	const confirmDialog = useConfirmDialog();
	const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
	const [applications, setApplications] = useState<VolunteerApplication[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
			const response = await getVolunteerApplications({
				page: currentPage,
				limit: pagination.itemsPerPage,
				status: statusFilter !== 'all' ? statusFilter : undefined,
				searchTerm: searchTerm || undefined,
			});

			if (response.success && response.data) {
				setApplications(response.data);
				if (response.pagination) {
					setPagination(response.pagination);
				}
			} else {
				toast.error(response.message || t('failedToFetchVolunteers'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : t('failedToFetchVolunteers');
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, [currentPage, searchTerm, statusFilter, pagination.itemsPerPage, t]);

	useEffect(() => {
		loadApplications();
	}, [loadApplications]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		loadApplications();
	};

	const handleStatusChange = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
		try {
			const response = await updateVolunteerApplicationStatus(id, newStatus);
			if (response.success) {
				toast.success(t('volunteerStatusUpdated'));
				loadApplications();
			} else {
				toast.error(response.message || t('volunteerStatusUpdateFailed'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : t('volunteerStatusUpdateFailed');
			toast.error(message);
		}
	};

	const handleDelete = async (id: string) => {
		const confirmed = await confirmDialog({
			title: t('delete'),
			description: t('deleteVolunteerConfirm'),
			confirmText: t('delete'),
			cancelText: t('cancel'),
			confirmVariant: 'danger',
		});
		if (!confirmed) return;

		try {
			const response = await deleteVolunteerApplication(id);
			if (response.success) {
				toast.success(t('volunteerDeleted'));
				loadApplications();
			} else {
				toast.error(response.message || t('volunteerDeleteFailed'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : t('volunteerDeleteFailed');
			toast.error(message);
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

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'rejected':
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
		return value;
	};

	const renderDetailSections = (application: VolunteerApplication) => {
		const sections: DetailSection[] = [
			{
				title: t('personalInformation'),
				fields: [
					{ label: t('name'), value: application.name },
					{ label: t('fatherName'), value: application.fatherName },
					{ label: t('email'), value: application.email },
					{ label: t('mobile'), value: `${application.mobileCountryCode} ${application.mobileNumber}` },
					{ label: t('status'), value: application.status },
					{ label: t('appliedAt'), value: formatDate(application.createdAt) },
				],
			},
			{
				title: t('professionalInformation'),
				fields: [
					{ label: t('currentProfession'), value: application.currentProfession },
					{ label: t('organizationName'), value: application.organizationName },
					{ label: t('workplaceAddress'), value: application.workplaceAddress },
				],
			},
			{
				title: t('currentAddress'),
				fields: [
					{ label: t('division'), value: application.currentDivision },
					{ label: t('district'), value: application.currentDistrict },
					{ label: t('upazila'), value: application.currentUpazila },
					{ label: t('union'), value: application.currentUnion },
					{ label: t('fullAddress'), value: application.currentFullAddress },
				],
			},
			{
				title: t('permanentAddress'),
				fields: [
					{ label: t('division'), value: application.permanentDivision },
					{ label: t('district'), value: application.permanentDistrict },
					{ label: t('upazila'), value: application.permanentUpazila },
					{ label: t('union'), value: application.permanentUnion },
					{ label: t('fullAddress'), value: application.permanentFullAddress },
				],
			},
			{
				title: t('overseasIfApplicable'),
				fields: [
					{ label: t('country'), value: application.overseasCountry },
					{ label: t('overseasAddress'), value: application.overseasAddress },
				],
			},
			{
				title: t('socialMediaMessaging'),
				fields: [
					{ label: t('facebookId'), value: application.fbNotUsed ? t('notUsed') : application.facebookId },
					{ label: t('linkedinId'), value: application.linkedinId },
					{ label: t('whatsapp'), value: application.whatsappNumber ? `${application.whatsappCountryCode || ''} ${application.whatsappNumber}` : undefined },
					{ label: t('telegram'), value: application.telegramNumber ? `${application.telegramCountryCode || ''} ${application.telegramNumber}` : undefined },
				],
			},
			{
				title: t('educationalQualification'),
				fields: [
					{ label: t('educationMedium'), value: application.educationMedium },
					{ label: t('educationLevel'), value: application.educationLevel },
					{ label: t('currentClassYear'), value: application.currentClassYear },
					{ label: t('departmentDegree'), value: application.departmentDegree },
					{ label: t('lastInstitutionName'), value: application.lastInstitutionName },
				],
			},
			{
				title: t('previousVolunteerExperience'),
				fields: [
					{ label: t('wasVolunteer'), value: application.wasVolunteer ? t('yes') : t('no') },
					{ label: t('projectName'), value: application.previousProjectName },
					{ label: t('projectLocation'), value: application.previousProjectLocation },
					{ label: t('batch'), value: application.previousBatch },
					{ label: t('beneficiariesCount'), value: application.previousBeneficiariesCount },
				],
			},
			{
				title: t('profileImage'),
				fields: [
					application.profileImage
						? {
								label: t('imageUrl'),
								content: (
									<div className="flex items-center gap-3">
										<div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={getImageUrl(application.profileImage)}
												alt={`${application.name} profile`}
												className="h-full w-full object-cover"
											/>
										</div>
										<a
											href={`${config.api.baseUrl}${application.profileImage}`}
											target="_blank"
											rel="noreferrer"
											className="text-sm font-medium text-emerald-600 hover:underline"
										>
											{t('viewFullImage')}
										</a>
									</div>
								),
						  }
						: { label: t('imageUrl'), value: t('notAvailable') },
				],
			},
		];

		return (
			<div className="space-y-6">
				{sections.map((section) => (
					<div key={section.title} className="space-y-3">
						<h4 className="text-sm font-semibold text-gray-700">{section.title}</h4>
						<div className="grid gap-3 md:grid-cols-2">
							{section.fields.map((field) => (
								<div key={field.label} className="rounded-lg border bg-gray-50 p-3">
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Volunteer Applications</h1>
					<p className="text-gray-600">Manage all volunteer applications</p>
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
							placeholder="Search by name, email, or mobile number..."
							className="w-full rounded-lg border px-3 py-2"
						/>
					</div>
					<div>
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected');
								setCurrentPage(1);
							}}
							className="w-full md:w-auto rounded-lg border px-3 py-2"
						>
							<option value="all">All Status</option>
							<option value="pending">Pending</option>
							<option value="approved">Approved</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>
					<Button type="submit">Search</Button>
				</form>
			</div>

			{/* Applications Table */}
			<div className="rounded-2xl border bg-white p-4 shadow-sm">
				{loading ? (
					<div className="py-8 text-center text-gray-500">Loading...</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-gray-500 border-b">
										<th className="py-3 pr-4">Name</th>
										<th className="py-3 pr-4">Email</th>
										<th className="py-3 pr-4">Mobile</th>
										<th className="py-3 pr-4">Status</th>
										<th className="py-3 pr-4">Applied Date</th>
										<th className="py-3 pr-4">Status Actions</th>
										<th className="py-3 pr-4">Details</th>
										<th className="py-3 pr-4">Actions</th>
									</tr>
								</thead>
								<tbody>
									{applications.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-gray-500">
												No volunteer applications found
											</td>
										</tr>
									) : (
										applications.map((application) => (
											<Fragment key={application._id}>
												<tr className="border-t">
													<td className="py-3 pr-4 font-medium">{application.name}</td>
													<td className="py-3 pr-4">{application.email}</td>
													<td className="py-3 pr-4">
														{application.mobileCountryCode} {application.mobileNumber}
													</td>
													<td className="py-3 pr-4">
														<span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(application.status)}`}>
															{application.status.toUpperCase()}
														</span>
													</td>
													<td className="py-3 pr-4">{formatDate(application.createdAt)}</td>
													<td className="py-3 pr-4">
														<select
															value={application.status}
															onChange={(e) => handleStatusChange(application._id, e.target.value as 'pending' | 'approved' | 'rejected')}
															className="w-full rounded-lg border px-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
														>
															<option value="pending">Pending</option>
															<option value="approved">Approved</option>
															<option value="rejected">Rejected</option>
														</select>
													</td>
													<td className="py-3 pr-4">
														<button
															onClick={() => toggleRowExpansion(application._id)}
															className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
															aria-label={isRowExpanded(application._id) ? 'Hide details' : 'Show details'}
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
															Delete
														</Button>
													</td>
												</tr>
												{isRowExpanded(application._id) && (
													<tr className="border-t bg-gray-50/70">
														<td colSpan={8} className="p-4">
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
									Showing {(currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
									{Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
									{pagination.totalItems} applications
								</div>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										Previous
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
										Next
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

