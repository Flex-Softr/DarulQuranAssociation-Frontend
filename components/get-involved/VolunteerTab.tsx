'use client';

import * as React from 'react';
import Button from '../../components/ui/Button';
import { createVolunteerApplication } from '../../services/volunteers';
import { toast } from 'sonner';
import { useI18n } from '../../components/i18n/LanguageProvider';

export default function VolunteerTab(): React.ReactElement {
	const { t } = useI18n();
	const [submitted, setSubmitted] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [fbNotUsed, setFbNotUsed] = React.useState(false);
	const [wasVolunteer, setWasVolunteer] = React.useState(false);
	const [profileImage, setProfileImage] = React.useState<File | null>(null);
	const [imagePreview, setImagePreview] = React.useState<string | null>(null);
	const [imageError, setImageError] = React.useState<string | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Form state
	const [name, setName] = React.useState('');
	const [fatherName, setFatherName] = React.useState('');
	const [mobileNumber, setMobileNumber] = React.useState('');
	const [mobileCountryCode, setMobileCountryCode] = React.useState('+880');
	const [email, setEmail] = React.useState('');
	const [currentProfession, setCurrentProfession] = React.useState('');
	const [organizationName, setOrganizationName] = React.useState('');
	const [workplaceAddress, setWorkplaceAddress] = React.useState('');
	const [currentDivision, setCurrentDivision] = React.useState('');
	const [currentDistrict, setCurrentDistrict] = React.useState('');
	const [currentUpazila, setCurrentUpazila] = React.useState('');
	const [currentUnion, setCurrentUnion] = React.useState('');
	const [currentFullAddress, setCurrentFullAddress] = React.useState('');
	const [permanentDivision, setPermanentDivision] = React.useState('');
	const [permanentDistrict, setPermanentDistrict] = React.useState('');
	const [permanentUpazila, setPermanentUpazila] = React.useState('');
	const [permanentUnion, setPermanentUnion] = React.useState('');
	const [permanentFullAddress, setPermanentFullAddress] = React.useState('');
	const [overseasCountry, setOverseasCountry] = React.useState('');
	const [overseasAddress, setOverseasAddress] = React.useState('');
	const [facebookId, setFacebookId] = React.useState('');
	const [linkedinId, setLinkedinId] = React.useState('');
	const [whatsappNumber, setWhatsappNumber] = React.useState('');
	const [whatsappCountryCode, setWhatsappCountryCode] = React.useState('+880');
	const [telegramNumber, setTelegramNumber] = React.useState('');
	const [telegramCountryCode, setTelegramCountryCode] = React.useState('+880');
	const [educationMedium, setEducationMedium] = React.useState('');
	const [educationLevel, setEducationLevel] = React.useState('');
	const [currentClassYear, setCurrentClassYear] = React.useState('');
	const [departmentDegree, setDepartmentDegree] = React.useState('');
	const [lastInstitutionName, setLastInstitutionName] = React.useState('');
	const [previousProjectName, setPreviousProjectName] = React.useState('');
	const [previousProjectLocation, setPreviousProjectLocation] = React.useState('');
	const [previousBatch, setPreviousBatch] = React.useState('');
	const [previousBeneficiariesCount, setPreviousBeneficiariesCount] = React.useState('');

	// Validation errors
	const [emailError, setEmailError] = React.useState<string | null>(null);
	const [mobileNumberError, setMobileNumberError] = React.useState<string | null>(null);
	const [whatsappNumberError, setWhatsappNumberError] = React.useState<string | null>(null);
	const [telegramNumberError, setTelegramNumberError] = React.useState<string | null>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Reset error
		setImageError(null);

		// Validate file type
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		const isValidType = validTypes.includes(file.type) || 
			['jpeg', 'jpg', 'png', 'heic'].includes(fileExtension || '');

		if (!isValidType) {
			setImageError(t('volunteerFormImageFormatError'));
			return;
		}

		// Validate file size (3 MB = 3 * 1024 * 1024 bytes)
		const maxSize = 3 * 1024 * 1024; // 3 MB in bytes
		if (file.size > maxSize) {
			setImageError(t('volunteerFormImageSizeError'));
			return;
		}

		// Set the file and create preview
		setProfileImage(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleImageUploadClick = () => {
		fileInputRef.current?.click();
	};

	// Validation functions
	const validateEmail = (emailValue: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailValue) {
			setEmailError(t('fillThisField'));
			return false;
		}
		if (!emailRegex.test(emailValue)) {
			setEmailError(t('invalidEmail'));
			return false;
		}
		setEmailError(null);
		return true;
	};

	const validatePhoneNumber = (phoneValue: string, isRequired: boolean = false): boolean => {
		if (!phoneValue) {
			if (isRequired) {
				return false;
			}
			return true; // Optional fields are valid if empty
		}
		// Remove any non-digit characters
		const digitsOnly = phoneValue.replace(/\D/g, '');
		if (digitsOnly.length !== 11) {
			return false;
		}
		return true;
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);
		if (submitted || value) {
			validateEmail(value);
		}
	};

	const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, ''); // Only allow digits
		setMobileNumber(value);
		if (submitted || value) {
			if (!validatePhoneNumber(value, true)) {
				if (!value) {
					setMobileNumberError(t('fillThisField'));
				} else {
					setMobileNumberError(t('mobileBangladeshInvalid'));
				}
			} else {
				setMobileNumberError(null);
			}
		}
	};

	const handleWhatsappNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, ''); // Only allow digits
		setWhatsappNumber(value);
		if (value) {
			if (!validatePhoneNumber(value, false)) {
				setWhatsappNumberError(t('mobileBangladeshInvalid'));
			} else {
				setWhatsappNumberError(null);
			}
		} else {
			setWhatsappNumberError(null);
		}
	};

	const handleTelegramNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, ''); // Only allow digits
		setTelegramNumber(value);
		if (value) {
			if (!validatePhoneNumber(value, false)) {
				setTelegramNumberError(t('mobileBangladeshInvalid'));
			} else {
				setTelegramNumberError(null);
			}
		} else {
			setTelegramNumberError(null);
		}
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);

		// Validate all fields
		const isEmailValid = validateEmail(email);
		const isMobileValid = validatePhoneNumber(mobileNumber, true);
		const isWhatsappValid = !whatsappNumber || validatePhoneNumber(whatsappNumber, false);
		const isTelegramValid = !telegramNumber || validatePhoneNumber(telegramNumber, false);

		if (!isEmailValid) {
			if (!email) {
				setEmailError(t('fillThisField'));
			} else {
				setEmailError(t('invalidEmail'));
			}
		}
		if (!isMobileValid) {
			if (!mobileNumber) {
				setMobileNumberError(t('fillThisField'));
			} else {
				setMobileNumberError(t('mobileBangladeshInvalid'));
			}
		}
		if (whatsappNumber && !isWhatsappValid) {
			setWhatsappNumberError(t('mobileBangladeshInvalid'));
		}
		if (telegramNumber && !isTelegramValid) {
			setTelegramNumberError(t('mobileBangladeshInvalid'));
		}

		// Don't submit if validation fails
		if (!isEmailValid || !isMobileValid || !isWhatsappValid || !isTelegramValid) {
			return;
		}

		setLoading(true);

		try {
			const applicationData = {
				// Personal Information
				name,
				fatherName,
				mobileNumber,
				mobileCountryCode,
				email,
				
				// Professional Information
				currentProfession,
				organizationName,
				workplaceAddress,
				
				// Current Address
				currentDivision,
				currentDistrict,
				currentUpazila,
				currentUnion,
				currentFullAddress,
				
				// Permanent Address
				permanentDivision,
				permanentDistrict,
				permanentUpazila,
				permanentUnion,
				permanentFullAddress,
				
				// Overseas (if applicable)
				overseasCountry: overseasCountry || undefined,
				overseasAddress: overseasAddress || undefined,
				
				// Social Media
				facebookId: fbNotUsed ? undefined : facebookId,
				linkedinId: linkedinId || undefined,
				whatsappNumber: whatsappNumber || undefined,
				whatsappCountryCode: whatsappNumber ? whatsappCountryCode : undefined,
				telegramNumber: telegramNumber || undefined,
				telegramCountryCode: telegramNumber ? telegramCountryCode : undefined,
				fbNotUsed,
				
				// Educational Qualification
				educationMedium,
				educationLevel,
				currentClassYear,
				departmentDegree: departmentDegree || undefined,
				lastInstitutionName,
				
				// Previous Volunteer Experience
				wasVolunteer,
				previousProjectName: wasVolunteer ? previousProjectName : undefined,
				previousProjectLocation: wasVolunteer ? previousProjectLocation : undefined,
				previousBatch: wasVolunteer ? previousBatch : undefined,
				previousBeneficiariesCount: wasVolunteer ? (previousBeneficiariesCount ? parseInt(previousBeneficiariesCount) : undefined) : undefined,
				
				// Profile Image
				profileImage: profileImage || null,
			};

			const response = await createVolunteerApplication(applicationData);

			if (response.success) {
				toast.success(t('volunteerApplicationSubmitted'));
				// Reset form
				const form = e.target as HTMLFormElement;
				form.reset();
				setName('');
				setFatherName('');
				setMobileNumber('');
				setEmail('');
				setCurrentProfession('');
				setOrganizationName('');
				setWorkplaceAddress('');
				setCurrentDivision('');
				setCurrentDistrict('');
				setCurrentUpazila('');
				setCurrentUnion('');
				setCurrentFullAddress('');
				setPermanentDivision('');
				setPermanentDistrict('');
				setPermanentUpazila('');
				setPermanentUnion('');
				setPermanentFullAddress('');
				setOverseasCountry('');
				setOverseasAddress('');
				setFacebookId('');
				setLinkedinId('');
				setWhatsappNumber('');
				setTelegramNumber('');
				setEducationMedium('');
				setEducationLevel('');
				setCurrentClassYear('');
				setDepartmentDegree('');
				setLastInstitutionName('');
				setPreviousProjectName('');
				setPreviousProjectLocation('');
				setPreviousBatch('');
				setPreviousBeneficiariesCount('');
				setFbNotUsed(false);
				setWasVolunteer(false);
				setProfileImage(null);
				setImagePreview(null);
				setSubmitted(false);
			} else {
				toast.error(response.message || t('volunteerApplicationError'));
			}
		} catch (error) {
			console.error('Error submitting volunteer application:', error);
			toast.error(t('volunteerApplicationError'));
		} finally {
			setLoading(false);
		}
	};

		return (
		<div className="space-y-8">
			{/* Top section: heading + image, and green rules card */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<div className="space-y-3">
					<h3 className="text-xl font-extrabold text-emerald-900">{t('volunteerJoinTitle')}</h3>
					<p className="text-sm text-gray-700 leading-7">
						{t('volunteerJoinDesc')}
					</p>
					<div className="rounded-2xl overflow-hidden">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/img/bg-large.png" alt="Volunteer" className="w-full rounded-2xl object-cover" />
					</div>
					<p className="text-sm text-gray-700 leading-7">
						{t('volunteerDesc2')}
					</p>
				</div>

				<div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-3">
					<h4 className="text-emerald-900 font-semibold">{t('volunteerRulesTitle')}</h4>
					<ul className="space-y-2 text-gray-800 text-sm">
						<li className="flex items-start gap-2">
							<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">✓</span>
							{t('volunteerRule1')}
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">✓</span>
							{t('volunteerRule2')}
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">✓</span>
							{t('volunteerRule3')}
						</li>
						<li className="flex items-start gap-2">
							<span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">✓</span>
							{t('volunteerRule4')}
						</li>
					</ul>
				</div>
			</div>

			{/* Center quote card */}
			<div className="rounded-2xl bg-gray-100 border border-gray-200 p-5 text-center">
				<p className="font-semibold text-gray-800">
					{t('volunteerQuote')}
				</p>
			</div>

			{/* Volunteer application form - exact structure */}
			<div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
				<div className="rounded-t-2xl bg-emerald-700 text-white px-5 py-4">
					<h3 className="text-lg font-extrabold text-center">{t('volunteerApplicationTitle')}</h3>
					<p className="text-emerald-50 text-sm text-center">
						{t('volunteerApplicationSubtitle')}
					</p>
				</div>

				<form onSubmit={onSubmit} className="p-5 space-y-6">
					{/* ব্যক্তিগত তথ্য */}
					<section className="space-y-4 border-b border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('personalInformation')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('name')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={name} onChange={(e) => setName(e.target.value)} required />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('fatherName')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('mobileNumber')} <span className="text-red-600">*</span></label>
								<div className="flex gap-2">
									<select className="rounded-lg border px-3 py-2" value={mobileCountryCode} onChange={(e) => setMobileCountryCode(e.target.value)}>
										<option value="+880">🇧🇩 +880</option>
									</select>
									<div className="flex-1">
										<input 
											className={`flex-1 w-full rounded-lg border px-3 py-2 ${mobileNumberError ? 'border-red-500' : ''}`} 
											placeholder="01XXXXXXXXX" 
											value={mobileNumber} 
											onChange={handleMobileNumberChange} 
											maxLength={11}
											required 
										/>
										{mobileNumberError && (
											<p className="text-xs text-red-600 mt-1">{mobileNumberError}</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('email')} <span className="text-red-600">*</span></label>
								<div>
									<input 
										type="email" 
										className={`w-full rounded-lg border px-3 py-2 ${emailError ? 'border-red-500' : ''}`} 
										placeholder={t('emailPlaceholder')} 
										value={email} 
										onChange={handleEmailChange} 
										required
									/>
									{emailError && (
										<p className="text-xs text-red-600 mt-1">{emailError}</p>
									)}
								</div>
							</div>
						</div>
					</section>

					{/* পেশাগত তথ্য */}
					<section className="space-y-4 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('professionalInformation')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('currentProfession')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentProfession} onChange={(e) => setCurrentProfession(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('organizationName')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">{t('workplaceAddress')} <span className="text-red-600">*</span></label>
							<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={workplaceAddress} onChange={(e) => setWorkplaceAddress(e.target.value)} required/>
						</div>
					</section>

					{/* বর্তমান ঠিকানা */}
					<section className="space-y-4">
						<h4 className="text-base font-semibold">{t('currentAddress')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('division')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentDivision} onChange={(e) => setCurrentDivision(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('district')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentDistrict} onChange={(e) => setCurrentDistrict(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('upazila')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentUpazila} onChange={(e) => setCurrentUpazila(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('union')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentUnion} onChange={(e) => setCurrentUnion(e.target.value)} required/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">{t('fullAddress')} <span className="text-red-600">*</span></label>
							<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentFullAddress} onChange={(e) => setCurrentFullAddress(e.target.value)} required />
						</div>
					</section>

					{/* স্থায়ী ঠিকানা */}
					<section className="space-y-4 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('permanentAddress')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('division')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={permanentDivision} onChange={(e) => setPermanentDivision(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('district')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={permanentDistrict} onChange={(e) => setPermanentDistrict(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('upazila')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={permanentUpazila} onChange={(e) => setPermanentUpazila(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('union')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={permanentUnion} onChange={(e) => setPermanentUnion(e.target.value)} required/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">{t('fullAddress')} <span className="text-red-600">*</span></label>
							<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={permanentFullAddress} onChange={(e) => setPermanentFullAddress(e.target.value)} required />
						</div>
					</section>

                    {/* প্রবাসী হলে */}
					<section className="space-y-4 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('volunteerFormOverseas')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('country')}</label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={overseasCountry} onChange={(e) => setOverseasCountry(e.target.value)} />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('fullAddress')}</label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={overseasAddress} onChange={(e) => setOverseasAddress(e.target.value)}/>
							</div>
							
						</div>
						
					</section>

					{/* সোশ্যাল মিডিয়া তথ্য */}
					<section className="space-y-4 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('volunteerFormSocialMedia')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">
									{t('facebookId')} {!fbNotUsed && <span className="text-red-600">*</span>}
								</label>
								<input 
									className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
									placeholder={t('linkPlaceholder')} 
									value={facebookId}
									onChange={(e) => setFacebookId(e.target.value)}
									required={!fbNotUsed}
									disabled={fbNotUsed}
								/>
							</div>
							<div className="flex items-end gap-2">
								<label className="block text-sm font-medium mb-1 sr-only">{t('volunteerFormNotUsingFacebook')}</label>
								<div className="flex items-center gap-2 ml-auto">
									<input 
										id="fb-na" 
										type="checkbox" 
										className="h-4 w-4" 
										checked={fbNotUsed}
										onChange={(e) => setFbNotUsed(e.target.checked)}
									/>
									<label htmlFor="fb-na" className="text-sm">{t('volunteerFormNotUsingFacebook')}</label>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('linkedinId')}</label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('linkPlaceholder')} value={linkedinId} onChange={(e) => setLinkedinId(e.target.value)} />
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('whatsapp')}</label>
								<div className="flex gap-2">
									<select className="rounded-lg border px-3 py-2" value={whatsappCountryCode} onChange={(e) => setWhatsappCountryCode(e.target.value)}>
										<option value="+880">🇧🇩 +880</option>
									</select>
									<div className="flex-1">
										<input 
											className={`flex-1 w-full rounded-lg border px-3 py-2 ${whatsappNumberError ? 'border-red-500' : ''}`} 
											placeholder="01XXXXXXXXX" 
											value={whatsappNumber} 
											onChange={handleWhatsappNumberChange}
											maxLength={11}
										/>
										{whatsappNumberError && (
											<p className="text-xs text-red-600 mt-1">{whatsappNumberError}</p>
										)}
									</div>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('telegram')}</label>
								<div className="flex gap-2">
									<select className="rounded-lg border px-3 py-2" value={telegramCountryCode} onChange={(e) => setTelegramCountryCode(e.target.value)}>
										<option value="+880">🇧🇩 +880</option>
									</select>
									<div className="flex-1">
										<input 
											className={`flex-1 w-full rounded-lg border px-3 py-2 ${telegramNumberError ? 'border-red-500' : ''}`} 
											placeholder="01XXXXXXXXX" 
											value={telegramNumber} 
											onChange={handleTelegramNumberChange}
											maxLength={11}
										/>
										{telegramNumberError && (
											<p className="text-xs text-red-600 mt-1">{telegramNumberError}</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* শিক্ষাগত যোগ্যতা */}
					<section className="space-y-4 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('educationalQualification')}</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">{t('educationMedium')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={educationMedium} onChange={(e) => setEducationMedium(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('educationLevel')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('currentClassYear')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={currentClassYear} onChange={(e) => setCurrentClassYear(e.target.value)} required/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">{t('departmentDegree')}</label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={departmentDegree} onChange={(e) => setDepartmentDegree(e.target.value)} />
							</div>
							<div className="md:col-span-2">
								<label className="block text-sm font-medium mb-1">{t('lastInstitutionName')} <span className="text-red-600">*</span></label>
								<input className="w-full rounded-lg border px-3 py-2" placeholder={t('write')} value={lastInstitutionName} onChange={(e) => setLastInstitutionName(e.target.value)} required />
							</div>
						</div>
					</section>

					{/* পূর্বে স্বেচ্ছাসেবক ছিলেন? */}
					<section className="space-y-4 rounded-xl border border-emerald-100 p-4">
						<p className="text-sm text-gray-700">
							{t('volunteerFormProjectDescription')}
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-center gap-2">
								<input 
									id="was-vol" 
									type="checkbox" 
									className="h-4 w-4" 
									checked={wasVolunteer}
									onChange={(e) => setWasVolunteer(e.target.checked)}
								/>
								<label htmlFor="was-vol" className="text-sm">{t('volunteerFormWasVolunteer')}</label>
							</div>
							<div />
							<div>
								<label className="block text-sm font-medium mb-1">
									{t('projectName')} {wasVolunteer && <span className="text-red-600">*</span>}
								</label>
								<input 
									className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
									placeholder={t('write')} 
									value={previousProjectName}
									onChange={(e) => setPreviousProjectName(e.target.value)}
									required={wasVolunteer}
									disabled={!wasVolunteer}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									{t('implementationLocation')} {wasVolunteer && <span className="text-red-600">*</span>}
								</label>
								<input 
									className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
									placeholder={t('write')} 
									value={previousProjectLocation}
									onChange={(e) => setPreviousProjectLocation(e.target.value)}
									required={wasVolunteer}
									disabled={!wasVolunteer}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									{t('batch')} {wasVolunteer && <span className="text-red-600">*</span>}
								</label>
								<input 
									className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
									placeholder="YYYY" 
									value={previousBatch}
									onChange={(e) => setPreviousBatch(e.target.value)}
									required={wasVolunteer}
									disabled={!wasVolunteer}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">
									{t('howManyBeneficiaries')} {wasVolunteer && <span className="text-red-600">*</span>}
								</label>
								<input 
									type="number"
									className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed" 
									placeholder={t('write')} 
									value={previousBeneficiariesCount}
									onChange={(e) => setPreviousBeneficiariesCount(e.target.value)}
									required={wasVolunteer}
									disabled={!wasVolunteer}
								/>
							</div>
						</div>
						{/* <div>
							<button type="button" className="rounded-lg border px-4 py-2 text-sm">আরও তথ্য যুক্ত করুন</button>
						</div> */}
					</section>

					{/* প্রোফাইল ছবি আপলোড */}
					<section className="space-y-3 border-gray-200 border-2 p-4 rounded-xl">
						<h4 className="text-base font-semibold">{t('volunteerFormProfileImage')}</h4>
						<div className="rounded-xl border p-4 flex items-center gap-4">
							<div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex-shrink-0">
								{imagePreview ? (
									<img 
										src={imagePreview} 
										alt="Profile preview" 
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full" />
								)}
							</div>
							<div className="space-y-1 flex-1">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
									onChange={handleImageChange}
									className="hidden"
								/>
								<button 
									type="button" 
									onClick={handleImageUploadClick}
									className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
								>
									{t('volunteerFormUploadButton')}
								</button>
								<p className="text-xs text-gray-500">{t('volunteerFormImageHelper')}</p>
								{imageError && (
									<p className="text-xs text-red-600 mt-1">{imageError}</p>
								)}
								{profileImage && !imageError && (
									<p className="text-xs text-green-600 mt-1">
										{t('volunteerFormImageSelected')} ({Math.round(profileImage.size / 1024)} KB)
									</p>
								)}
							</div>
						</div>
					</section>

					<p className="text-sm text-red-600">
						{t('volunteerFormRequiredNote')}
					</p>

					<div className="pt-1">
						<Button type="submit" className="w-full py-3 text-base font-semibold" disabled={loading}>
							{loading ? t('volunteerFormSubmitting') : t('volunteerFormSubmitButton')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}


