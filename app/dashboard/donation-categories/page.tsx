'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import { DonationCategory, DonationCategoryInput, getAllDonationCategories, getDonationCategoryById } from '../../../services/donationCategories';
import { createDonationCategory, deleteDonationCategory, updateDonationCategory } from '../../../services/donationCategories/mutations';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/imageUtils';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

const initialForm: DonationCategoryInput = {
  title: '',
  subtitle: '',
  video: '',
  description: '',
  slug: '',
  expenseCategory: [],
  thumbnail: '',
  daily: null,
  monthly: null,
  amount: null,
  formTitle: '',
  formDescription: '',
};

type MediaValue = string | File;

const normalizeSingle = (value: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(value)) {
    return (value[0] ?? '') as MediaValue;
  }
  return (value ?? '') as MediaValue;
};

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function DonationCategoriesPage(): React.ReactElement {
  const { t } = useI18n();
  const confirmDialog = useConfirmDialog();
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [formData, setFormData] = useState<DonationCategoryInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [pageSize, setPageSize] = useState(10);
  
  // Checkbox states
  const [hasDaily, setHasDaily] = useState(false);
  const [hasMonthly, setHasMonthly] = useState(false);
  
  // Number array inputs
  const [dailyInput, setDailyInput] = useState<string>('');
  const [monthlyInput, setMonthlyInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [expenseInput, setExpenseInput] = useState<string>('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllDonationCategories({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
    //    console.log("response", response);
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setCategories(data);
        if (response.pagination) {
          setPagination(response.pagination);
          if (response.pagination.itemsPerPage) {
            setPageSize(response.pagination.itemsPerPage);
          }
          if (response.pagination.currentPage) {
            setCurrentPage(response.pagination.currentPage);
          }
        } else {
          setPagination({
            currentPage,
            totalPages: Math.max(1, Math.ceil(Math.max(data.length, 1) / pageSize)),
            totalItems: data.length,
            itemsPerPage: pageSize,
          });
        }
      } else {
        toast.error(response.message ?? t('operationFailed'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setHasDaily(false);
    setHasMonthly(false);
    setDailyInput('');
    setMonthlyInput('');
    setAmountInput('');
  };

  const handleSlugGenerate = () => {
    if (formData.title) {
      setFormData({ ...formData, slug: generateSlug(formData.title) });
    }
  };

  const handleAddNumberToArray = (field: 'daily' | 'monthly' | 'amount', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error(t('validPositiveNumber'));
      return;
    }

    const current = formData[field] || [];
    setFormData({
      ...formData,
      [field]: [...current, numValue],
    });

    // Clear input
    if (field === 'daily') setDailyInput('');
    else if (field === 'monthly') setMonthlyInput('');
    else setAmountInput('');
  };

  const handleRemoveNumberFromArray = (field: 'daily' | 'monthly' | 'amount', index: number) => {
    const current = formData[field] || [];
    setFormData({
      ...formData,
      [field]: current.filter((_, i) => i !== index),
    });
  };

  const handleCheckboxChange = (type: 'daily' | 'monthly') => {
    if (type === 'daily') {
      setHasDaily(!hasDaily);
      if (!hasDaily) {
        // Enable daily, disable amount if monthly is also disabled
        if (!hasMonthly) {
          setFormData({ ...formData, amount: null });
        }
      } else {
        // Disable daily, clear daily values
        setFormData({ ...formData, daily: null });
        setDailyInput('');
      }
    } else {
      setHasMonthly(!hasMonthly);
      if (!hasMonthly) {
        // Enable monthly, disable amount if daily is also disabled
        if (!hasDaily) {
          setFormData({ ...formData, amount: null });
        }
      } else {
        // Disable monthly, clear monthly values
        setFormData({ ...formData, monthly: null });
        setMonthlyInput('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: At least one of daily, monthly, or amount must be provided
    const hasDailyValues = formData.daily && formData.daily.length > 0;
    const hasMonthlyValues = formData.monthly && formData.monthly.length > 0;
    const hasAmountValues = formData.amount && formData.amount.length > 0;
    
    if (!hasDailyValues && !hasMonthlyValues && !hasAmountValues) {
      toast.error(t('atLeastOneDonationOption'));
      return;
    }
    // Validation: Thumbnail required as file on create
    if (!editingId) {
      const hasFileThumb = typeof formData.thumbnail !== 'string';
      if (!hasFileThumb) {
        toast.error(t('pleaseUploadThumbnail'));
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDonationCategory(editingId, formData);
        toast.success(t('donationCategoryUpdated'));
      } else {
        await createDonationCategory(formData);
        toast.success(t('donationCategoryCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (category: DonationCategory) => {
    if (!category.id) {
      toast.error(t('categoryIdMissing'));
      return;
    }
  //  console.log("category", category);
    try {
      // Fetch full category data
      const response = await getDonationCategoryById(category.id);
    //  console.log("response", response);
      
      // Use the fetched data if available, otherwise fall back to the category from list
      // But prefer the fetched data as it should have all fields
      const fullCategory = (response.success && response.data) ? response.data : category;
   //   console.log("fullCategory", fullCategory);

      // Set checkbox states based on existing data
      const hasDailyData = !!(fullCategory.daily && Array.isArray(fullCategory.daily) && fullCategory.daily.length > 0);
      const hasMonthlyData = !!(fullCategory.monthly && Array.isArray(fullCategory.monthly) && fullCategory.monthly.length > 0);
      setHasDaily(hasDailyData);
      setHasMonthly(hasMonthlyData);

      // Clear input states
      setDailyInput('');
      setMonthlyInput('');
      setAmountInput('');
      setExpenseInput('');

      // Ensure amount is set properly - preserve it regardless of checkbox state
      const amountValue = (fullCategory.amount && Array.isArray(fullCategory.amount) && fullCategory.amount.length > 0)
        ? fullCategory.amount
        : null;

      // Build form data with explicit field mapping
      const newFormData: DonationCategoryInput = {
        title: fullCategory.title ?? '',
        subtitle: fullCategory.subtitle ?? '',
        video: fullCategory.video ?? '',
        description: fullCategory.description ?? '',
        slug: fullCategory.slug ?? '',
        expenseCategory: Array.isArray(fullCategory.expenseCategory) ? fullCategory.expenseCategory : [],
        thumbnail: fullCategory.thumbnail 
          ? (fullCategory.thumbnail.startsWith('data:') || fullCategory.thumbnail.startsWith('http://') || fullCategory.thumbnail.startsWith('https://') || fullCategory.thumbnail.startsWith('blob:')
            ? fullCategory.thumbnail 
            : getImageUrl(fullCategory.thumbnail))
          : '',
        daily: (fullCategory.daily && Array.isArray(fullCategory.daily)) ? fullCategory.daily : null,
        monthly: (fullCategory.monthly && Array.isArray(fullCategory.monthly)) ? fullCategory.monthly : null,
        amount: amountValue,
        formTitle: fullCategory.formTitle ?? '',
        formDescription: fullCategory.formDescription ?? '',
      };

      setFormData(newFormData);
      setEditingId(fullCategory.id ?? null);
      setShowForm(true);
     // console.log("newFormData", newFormData);
    } catch (error) {
      console.error('Error loading category for edit:', error);
      toast.error(t('failedToLoadCategory'));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteDonationCategoryConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteDonationCategory(id);
      toast.success(t('donationCategoryDeleted'));
      await loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('deleteFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('donationCategories')}</h1>
          <p className="text-gray-600">{t('manageDonationCategories')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addCategory')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editDonationCategory') : t('addDonationCategory')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('title')} {t('required')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('subtitle')} {t('required')}</label>
                <input
                  type="text"
                  required
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('slug')} {t('required')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 rounded-lg border px-3 py-2"
                    disabled={submitting}
                  />
                  {/* <Button type="button" onClick={handleSlugGenerate} variant="secondary" disabled={submitting}>
                    {t('generate')}
                  </Button> */}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('videoUrl')} {t('required')}</label>
                <input
                  type="url"
                  required
                  value={formData.video}
                  onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('description')} {t('required')}</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={6}
                placeholder="Enter description (line breaks will be preserved)"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('expenseCategory')} {t('required')}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={expenseInput}
                    onChange={(e) => setExpenseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = expenseInput.trim();
                        if (!val) return;
                        setFormData({
                          ...formData,
                          expenseCategory: [...(formData.expenseCategory || []), val],
                        });
                        setExpenseInput('');
                      }
                    }}
                    className="flex-1 rounded-lg border px-3 py-2"
                    placeholder={t('addExpenseCategory')}
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = expenseInput.trim();
                      if (!val) return;
                      setFormData({
                        ...formData,
                        expenseCategory: [...(formData.expenseCategory || []), val],
                      });
                      setExpenseInput('');
                    }}
                    variant="secondary"
                    disabled={submitting}
                  >
                    {t('add')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.expenseCategory || []).map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            expenseCategory: formData.expenseCategory.filter((_, i) => i !== index),
                          })
                        }
                        className="hover:text-amber-900"
                        disabled={submitting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('thumbnail')} {t('required')}</label>
                <MediaUploader
                  value={formData.thumbnail}
                  onChange={(val) => setFormData({ ...formData, thumbnail: normalizeSingle(val) })}
                  accept="image/*"
                  label={t('uploadThumbnail')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('formTitle')} {t('required')}</label>
                <input
                  type="text"
                  required
                  value={formData.formTitle}
                  onChange={(e) => setFormData({ ...formData, formTitle: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('formDescription')} {t('required')}</label>
                <textarea
                  required
                  value={formData.formDescription}
                  onChange={(e) => setFormData({ ...formData, formDescription: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Donation Amount Options */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">{t('donationAmountOptions')}</h3>
              
              <div className="space-y-4">
                {/* Daily Checkbox */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={hasDaily}
                      onChange={() => handleCheckboxChange('daily')}
                      disabled={submitting}
                      className="rounded"
                    />
                    <span className="font-medium">{t('enableDailyDonationAmounts')}</span>
                  </label>
                  {hasDaily && (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dailyInput}
                          onChange={(e) => setDailyInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNumberToArray('daily', dailyInput);
                            }
                          }}
                          className="flex-1 rounded-lg border px-3 py-2"
                          placeholder={t('enterDailyAmount')}
                          disabled={submitting}
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddNumberToArray('daily', dailyInput)}
                          variant="secondary"
                          disabled={submitting}
                        >
                          {t('add')}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.daily || []).map((value, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => handleRemoveNumberFromArray('daily', index)}
                              className="hover:text-blue-900"
                              disabled={submitting}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Monthly Checkbox */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={hasMonthly}
                      onChange={() => handleCheckboxChange('monthly')}
                      disabled={submitting}
                      className="rounded"
                    />
                    <span className="font-medium">{t('enableMonthlyDonationAmounts')}</span>
                  </label>
                  {hasMonthly && (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={monthlyInput}
                          onChange={(e) => setMonthlyInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNumberToArray('monthly', monthlyInput);
                            }
                          }}
                          className="flex-1 rounded-lg border px-3 py-2"
                          placeholder={t('enterMonthlyAmount')}
                          disabled={submitting}
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddNumberToArray('monthly', monthlyInput)}
                          variant="secondary"
                          disabled={submitting}
                        >
                          {t('add')}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.monthly || []).map((value, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => handleRemoveNumberFromArray('monthly', index)}
                              className="hover:text-green-900"
                              disabled={submitting}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount (shows if neither daily nor monthly is checked) */}
                {!hasDaily && !hasMonthly && (
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('donationAmounts')} {t('required')}</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNumberToArray('amount', amountInput);
                          }
                        }}
                        className="flex-1 rounded-lg border px-3 py-2"
                        placeholder={t('enterDonationAmount')}
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddNumberToArray('amount', amountInput)}
                        variant="secondary"
                        disabled={submitting}
                      >
                        {t('add')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.amount || []).map((value, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {value}
                          <button
                            type="button"
                            onClick={() => handleRemoveNumberFromArray('amount', index)}
                            className="hover:text-purple-900"
                            disabled={submitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{editingId ? t('update') : t('save')}</Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold mb-3">{t('donationCategoriesList')}</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('subtitle')}</th>
                  <th className="py-2 pr-4">{t('slug')}</th>
                  <th className="py-2 pr-4">{t('expenseCategory')}</th>
                  <th className="py-2 pr-4">{t('thumbnail')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">{t('noDonationCategoriesYet')}</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-t">
                      <td className="py-2 pr-4">{category.title.slice(0,40)}...</td>
                      <td className="py-2 pr-4">{category.subtitle.slice(0,40)}...</td>
                      <td className="py-2 pr-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                      </td>
                      <td className="py-2 pr-4">{category.expenseCategory}</td>
                      <td className="py-2 pr-4">
                        {category.thumbnail ? (
                          <img src={getImageUrl(category.thumbnail)} alt={category.title} className="h-10 w-16 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-gray-400">{t('notAvailable')}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(category)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {category.id && (
                          <Button onClick={() => handleDelete(category.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PaginationBar
        entityLabel={t('donationCategories')}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setCurrentPage(1);
          setPageSize(size);
          setPagination((prev) => ({ ...prev, itemsPerPage: size }));
        }}
      />
    </div>
  );
}
