'use client';

import React from 'react';
import Button from '../../components/ui/Button';
import { useI18n } from '../../components/i18n/LanguageProvider';

interface ConfirmUpdateModalProps {
	isOpen: boolean;
	field: 'email' | 'phone';
	currentValue: string;
	newValue: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmUpdateModal({
	isOpen,
	field,
	currentValue,
	newValue,
	onConfirm,
	onCancel,
}: ConfirmUpdateModalProps): React.ReactElement | null {
	const { t } = useI18n();

	if (!isOpen) return null;

	const fieldLabel = field === 'email' ? t('email') : t('phone');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
				<h3 className="text-lg font-semibold mb-4">
					{t('confirmUpdate') || 'Confirm Update'} {fieldLabel}
				</h3>
				<div className="space-y-3 mb-6">
					<div>
						<p className="text-sm font-medium text-gray-600 mb-1">
							{t('current') || 'Current'} {fieldLabel}:
						</p>
						<p className="text-sm text-gray-900">{currentValue}</p>
					</div>
					<div>
						<p className="text-sm font-medium text-gray-600 mb-1">
							{t('new') || 'New'} {fieldLabel}:
						</p>
						<p className="text-sm text-gray-900">{newValue}</p>
					</div>
					<p className="text-sm text-amber-600 mt-4">
						{t('areYouSureYouWantToUpdate') || 'Are you sure you want to update'} {fieldLabel}?
					</p>
				</div>
				<div className="flex justify-end gap-3">
					<Button variant="secondary" onClick={onCancel}>
						{t('cancel') || 'Cancel'}
					</Button>
					<Button variant="primary" onClick={onConfirm}>
						{t('confirm') || 'Confirm'}
					</Button>
				</div>
			</div>
		</div>
	);
}

