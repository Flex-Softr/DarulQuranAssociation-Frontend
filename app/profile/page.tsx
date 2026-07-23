'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Container from '../../components/layout/Container';
import { getClientToken } from '../../lib/tokenUtils';
import { getCurrentUserProfile, updateMe } from '../../services/Users/me';
import { getMyDonations } from '../../services/donations';
import type { User } from '../../services/Users';
import UserInfo from '../../components/profile/UserInfo';
import DonationsTable from '../../components/profile/DonationsTable';
import PasswordForms from '../../components/profile/PasswordForms';
import ConfirmUpdateModal from '../../components/profile/ConfirmUpdateModal';
import { useI18n } from '../../components/i18n/LanguageProvider';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';

type TabKey = 'info' | 'donations' | 'password';

export default function ProfilePage(): React.ReactElement {
	const { t } = useI18n();
	const [active, setActive] = useState<TabKey>('info');
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [donations, setDonations] = useState<any[]>([]);
	const [donationsLoading, setDonationsLoading] = useState<boolean>(false);
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		phone: '',
		companyName: '',
		fullAddress: '',
	});
	const [updating, setUpdating] = useState<boolean>(false);
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		field: 'email' | 'phone';
		currentValue: string;
		newValue: string;
		pendingUpdate: Record<string, string>;
	} | null>(null);

	const isAuthed = useMemo(() => !!getClientToken(), []);

	useEffect(() => {
		let mounted = true;
		if (!isAuthed) {
			setLoading(false);
			setError(t('youNeedToLogin'));
			return;
		}
		(async () => {
			try {
				const res = await getCurrentUserProfile();
				if (!mounted) return;
				if (res.success && res.data) {
					setUser(res.data);
					setFormData({
						fullName: res.data.fullName || '',
						email: res.data.email || '',
						phone: res.data.phone || '',
						companyName: res.data.companyName || '',
						fullAddress: res.data.fullAddress || '',
					});
				} else {
					setError(res.message || t('failedToLoadProfile'));
				}
			} catch (e) {
				setError(t('failedToLoadProfile'));
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [isAuthed, t]);

	useEffect(() => {
		let mounted = true;
		if (active !== 'donations' || !isAuthed) return;
		setDonationsLoading(true);
		(async () => {
			try {
				const res = await getMyDonations();
				if (!mounted) return;
				if (res.success) {
					setDonations(res.data || []);
				}
			} finally {
				if (mounted) setDonationsLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [active, isAuthed]);

	const handleFieldChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleUpdateProfile = async (updateData: Record<string, string>) => {
		setUpdating(true);
		try {
			const response = await updateMe(updateData);
			if (response.success) {
				toast.success(response.message || t('profileUpdatedSuccessfully') || 'Profile updated successfully');
				if (response.data) {
					setUser(response.data);
					setFormData({
						fullName: response.data.fullName || '',
						email: response.data.email || '',
						phone: response.data.phone || '',
						companyName: response.data.companyName || '',
						fullAddress: response.data.fullAddress || '',
					});
				}
			} else {
				toast.error(response.message || t('failedToUpdateProfile') || 'Failed to update profile');
			}
		} catch (error) {
			toast.error(t('failedToUpdateProfile') || 'Failed to update profile');
		} finally {
			setUpdating(false);
			setConfirmModal(null);
		}
	};

	const handleSave = () => {
		if (!user) return;

		const updateData: Record<string, string> = {};
		const needsConfirmation: { field: 'email' | 'phone'; currentValue: string; newValue: string }[] = [];

		// Check for changes
		if (formData.fullName !== user.fullName) {
			updateData.fullName = formData.fullName;
		}

		if (formData.email !== user.email) {
			if (user.email) {
				// Existing email, needs confirmation
				needsConfirmation.push({
					field: 'email',
					currentValue: user.email,
					newValue: formData.email,
				});
			} else {
				updateData.email = formData.email;
			}
		}

		if (formData.phone !== user.phone) {
			if (user.phone) {
				// Existing phone, needs confirmation
				needsConfirmation.push({
					field: 'phone',
					currentValue: user.phone,
					newValue: formData.phone,
				});
			} else {
				updateData.phone = formData.phone;
			}
		}

		if (formData.companyName !== (user.companyName || '')) {
			updateData.companyName = formData.companyName;
		}

		if (formData.fullAddress !== (user.fullAddress || '')) {
			updateData.fullAddress = formData.fullAddress;
		}

		// If no changes, show message
		if (Object.keys(updateData).length === 0 && needsConfirmation.length === 0) {
			toast.info(t('noChangesToSave') || 'No changes to save');
			return;
		}

		// If phone or email needs confirmation, show modal
		if (needsConfirmation.length > 0) {
			const firstConfirmation = needsConfirmation[0];
			// Include all update data plus the field that needs confirmation
			const allUpdateData = {
				...updateData,
				[firstConfirmation.field]: firstConfirmation.newValue,
			};
			setConfirmModal({
				isOpen: true,
				field: firstConfirmation.field,
				currentValue: firstConfirmation.currentValue,
				newValue: firstConfirmation.newValue,
				pendingUpdate: allUpdateData,
			});
			return;
		}

		// No confirmation needed, proceed with update
		handleUpdateProfile(updateData);
	};

	const handleConfirmUpdate = () => {
		if (confirmModal) {
			handleUpdateProfile(confirmModal.pendingUpdate);
		}
	};

	const handleReset = () => {
		if (user) {
			setFormData({
				fullName: user.fullName || '',
				email: user.email || '',
				phone: user.phone || '',
				companyName: user.companyName || '',
				fullAddress: user.fullAddress || '',
			});
		}
	};

	return (
		<div className="py-10">
			<Container>
				<h1 className="text-2xl font-semibold mb-6">{t('myProfile')}</h1>

				<div className="mb-6 overflow-x-auto">
					<div className="inline-flex rounded-lg border border-gray-200 bg-white">
						<button
							className={`px-4 py-2 text-sm rounded-l-lg ${active === 'info' ? 'bg-brand text-white' : 'hover:bg-gray-50'}`}
							onClick={() => setActive('info')}
						>
							{t('info')}
						</button>
						<button
							className={`px-4 py-2 text-sm ${active === 'donations' ? 'bg-brand text-white' : 'hover:bg-gray-50'}`}
							onClick={() => setActive('donations')}
						>
							{t('donations')}
						</button>
						<button
							className={`px-4 py-2 text-sm ${active === 'password' ? 'bg-brand text-white' : 'hover:bg-gray-50'}`}
							onClick={() => setActive('password')}
						>
							{t('updatePassword')}
						</button>
						
					</div>
				</div>

				{loading ? (
					<p>{t('loading')}</p>
				) : error ? (
					<div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
				) : (
					<>
						{active === 'info' && user && (
							<div className="space-y-6">
								<UserInfo 
									user={user} 
									formData={formData}
									onChange={handleFieldChange}
									loading={updating}
								/>
								<div className="flex justify-end gap-3">
									<Button 
										variant="secondary" 
										onClick={handleReset}
										disabled={updating}
									>
										{t('reset') || 'Reset'}
									</Button>
									<Button 
										onClick={handleSave}
										disabled={updating}
									>
										{updating ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
									</Button>
								</div>
							</div>
						)}
						{active === 'donations' && (
							<DonationsTable loading={donationsLoading} donations={donations} />
						)}
						{active === 'password' && <PasswordForms mode="change" />}
					</>
				)}
				{confirmModal && (
					<ConfirmUpdateModal
						isOpen={confirmModal.isOpen}
						field={confirmModal.field}
						currentValue={confirmModal.currentValue}
						newValue={confirmModal.newValue}
						onConfirm={handleConfirmUpdate}
						onCancel={() => setConfirmModal(null)}
					/>
				)}
			</Container>
		</div>
	);
}


