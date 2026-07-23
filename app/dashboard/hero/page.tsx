'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import { HeroImage, HeroImageInput, createHeroImage, deleteHeroImage, getAllHeroImages, updateHeroImage } from '../../../services/hero';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/imageUtils';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

type MediaValue = string | File;

const initialForm: HeroImageInput = {
  image: '',
  title: '',
  description: '',
  order: 0,
  isActive: true,
};

const normalizeSingle = (value: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(value)) {
    return (value[0] ?? '') as MediaValue;
  }
  return (value ?? '') as MediaValue;
};

export default function HeroPage(): React.ReactElement {
  const { t } = useI18n();
  const confirmDialog = useConfirmDialog();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [formData, setFormData] = useState<HeroImageInput>(initialForm);
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

  const loadHeroImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllHeroImages({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        const sortedData = data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setHeroImages(sortedData);
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
            totalPages: Math.max(1, Math.ceil(Math.max(sortedData.length, 1) / pageSize)),
            totalItems: sortedData.length,
            itemsPerPage: pageSize,
          });
        }
      } else {
        toast.error((response.message ?? t('operationFailed')) || 'Failed to load hero images');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed') || 'Failed to load hero images';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, t]);

  useEffect(() => {
    void loadHeroImages();
  }, [loadHeroImages]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image || formData.image === '') {
      toast.error(t('pleaseUploadImage'));
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateHeroImage(editingId, formData);
        toast.success(t('heroImageUpdated'));
      } else {
        await createHeroImage(formData);
        toast.success(t('heroImageCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadHeroImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: HeroImage) => {
    setFormData({
      image: item.image ? getImageUrl(item.image) : '',
      title: item.title || '',
      description: item.description || '',
      order: item.order || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setEditingId(item.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteHeroImageConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteHeroImage(id);
      toast.success(t('heroImageDeleted'));
      await loadHeroImages();
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

  const handleToggleActive = async (item: HeroImage) => {
    if (!item.id) return;
    setSubmitting(true);
    try {
      await updateHeroImage(item.id, { isActive: !item.isActive });
      toast.success(!item.isActive ? t('heroImageActivated') : t('heroImageDeactivated'));
      await loadHeroImages();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('heroImages')}</h1>
          <p className="text-gray-600">{t('manageHeroImages')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addImage')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editHeroImage') : t('addHeroImage')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('titleOptional')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                  placeholder={t('imageTitle')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('order')}</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">{t('lowerNumbersAppearFirst')}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('descriptionOptional')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                  rows={3}
                  placeholder={t('imageDescription')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                    disabled={submitting}
                  />
                  {t('activeShowInSlider')}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('imageUrl')}</label>
              <MediaUploader
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: normalizeSingle(val) })}
                accept="image/*"
                label={t('uploadHeroImage')}
              />
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
        <h3 className="font-semibold mb-3">{t('heroImages')} ({heroImages.length})</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('imageUrl')}</th>
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('order')}</th>
                  <th className="py-2 pr-4">{t('status')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {heroImages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">{t('noHeroImagesYet')}</td>
                  </tr>
                ) : (
                  heroImages.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2 pr-4">
                        {item.image && (
                          <img src={getImageUrl(item.image)} alt={item.title || 'Hero image'} className="h-16 w-32 object-cover rounded" />
                        )}
                      </td>
                      <td className="py-2 pr-4">{item.title || '-'}</td>
                      <td className="py-2 pr-4">{item.order || 0}</td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          disabled={submitting || !item.id}
                        >
                          {item.isActive ? t('active') : t('inactive')}
                        </button>
                      </td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(item)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {item.id && (
                          <Button onClick={() => handleDelete(item.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
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
        entityLabel={t('heroImages')}
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

