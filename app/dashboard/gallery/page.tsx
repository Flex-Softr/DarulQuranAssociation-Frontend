'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import {
  GalleryInput,
  GalleryItem,
  createGalleryItem,
  deleteGalleryItem,
  getAllGalleryItems,
  updateGalleryItem,
} from '../../../services/gallery';
import {
  GalleryCategory,
  GalleryCategoryInput,
  getAllGalleryCategories,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
} from '../../../services/galleryCategory';
import { toast } from 'sonner';
import { getImageUrl } from '../../../lib/imageUtils';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

type MediaValue = string | File;

const initialForm: GalleryInput = {
  title: '',
  media: '',
  category: '',
  type: 'image',
};

const normalizeSingle = (value: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(value)) {
    return (value[0] ?? '') as MediaValue;
  }
  return (value ?? '') as MediaValue;
};

function GalleryPageContent(): React.ReactElement {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const confirmDialog = useConfirmDialog();
  const filtersKey = searchParams.toString();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [formData, setFormData] = useState<GalleryInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<GalleryCategoryInput>({ title: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
  });
  const [pageSize, setPageSize] = useState(12);

  const loadGalleryItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filtersKey);
      const categoryFilter = params.get('category') || undefined;
      const typeParam = params.get('type');
      const typeFilter =
        typeParam === 'image' || typeParam === 'video' ? (typeParam as 'image' | 'video') : undefined;

      const response = await getAllGalleryItems({
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setGalleryItems(data);
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
  }, [filtersKey, currentPage, pageSize, t]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await getAllGalleryCategories();
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setCategories(data);
      } else {
        toast.error(response.message ?? t('operationFailed'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setLoadingCategories(false);
    }
  }, [t]);

  useEffect(() => {
    void loadGalleryItems();
    void loadCategories();
  }, [loadGalleryItems, loadCategories]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type === 'image' && (!formData.media || formData.media === '')) {
      toast.error(t('uploadImage'));
      return;
    }
    if (formData.type === 'video' && typeof formData.media === 'string' && formData.media.trim() === '') {
      toast.error(t('pleaseProvideVideoUrl'));
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateGalleryItem(editingId, formData);
        toast.success(t('galleryItemUpdated'));
      } else {
        await createGalleryItem(formData);
        toast.success(t('galleryItemCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadGalleryItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setFormData({
      title: item.title,
      media: item.media ? (item.type === 'image' ? getImageUrl(item.media) : item.media) : '',
      category: item.category,
      type: item.type,
    });
    setEditingId(item.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteGalleryItemConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteGalleryItem(id);
      toast.success(t('galleryItemDeleted'));
      await loadGalleryItems();
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

  const getMediaAccept = () => (formData.type === 'video' ? 'video/*' : 'image/*');

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.title.trim()) {
      toast.error(t('title') + ' ' + t('isRequired'));
      return;
    }
    setSubmitting(true);
    try {
      if (editingCategoryId) {
        await updateGalleryCategory(editingCategoryId, categoryFormData);
        toast.success(t('categoryUpdated') || 'Category updated successfully');
      } else {
        await createGalleryCategory(categoryFormData);
        toast.success(t('categoryCreated') || 'Category created successfully');
      }
      setCategoryFormData({ title: '' });
      setEditingCategoryId(null);
      setShowCategoryModal(false);
      await loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryCancel = () => {
    setCategoryFormData({ title: '' });
    setEditingCategoryId(null);
    setShowCategoryModal(false);
  };

  const handleCategoryEdit = (category: GalleryCategory) => {
    setCategoryFormData({ title: category.title });
    setEditingCategoryId(category.id ?? null);
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteCategoryConfirm') || 'Are you sure you want to delete this category?',
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteGalleryCategory(id);
      toast.success(t('categoryDeleted') || 'Category deleted successfully');
      await loadCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('deleteFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('gallery')}</h1>
          <p className="text-gray-600">{t('manageGalleryItems')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => { 
              setCategoryFormData({ title: '' }); 
              setEditingCategoryId(null); 
              setShowCategoryModal(true); 
            }}
          >
            {t('createCategory')}
          </Button>
          <Button onClick={() => { setShowForm(true); resetForm(); }}>
            {t('addItem')}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('edit') : t('new')} {t('gallery')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('title')}</label>
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
                <label className="block text-sm font-medium mb-1">{t('category')}</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting || loadingCategories}
                >
                  <option value="" disabled>
                    {t('selectCategory')}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.title}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('type')}</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'image' | 'video', media: '' })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                >
                  <option value="image">{t('image')}</option>
                  <option value="video">{t('video')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.type === 'video' ? t('videoUrl') : t('imageUrl')}
              </label>
              {formData.type === 'video' ? (
                <input
                  type="url"
                  required
                  value={typeof formData.media === 'string' ? formData.media : ''}
                  onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="https://..."
                  disabled={submitting}
                />
              ) : (
                <MediaUploader
                  value={formData.media}
                  onChange={(val) => setFormData({ ...formData, media: normalizeSingle(val) })}
                  accept={getMediaAccept()}
                  label={t('uploadImage')}
                />
              )}
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
        <h3 className="font-semibold mb-3">{t('gallery')}</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('category')}</th>
                  <th className="py-2 pr-4">{t('type')}</th>
                  <th className="py-2 pr-4">{t('imageUrl')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {galleryItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">{t('noGalleryItemsYet')}</td>
                  </tr>
                ) : (
                  galleryItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2 pr-4">{item.title}</td>
                      <td className="py-2 pr-4">{item.category}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs uppercase">
                          {item.type === 'video' ? t('video') : t('image')}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {item.media && (
                          item.type === 'video' ? (
                            <a
                              href={item.media}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 underline"
                            >
                              {t('viewVideo')}
                            </a>
                          ) : (
                            <img src={getImageUrl(item.media)} alt={item.title} className="h-16 w-24 object-cover rounded" />
                          )
                        )}
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
        entityLabel={t('gallery')}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setCurrentPage(1);
          setPageSize(size);
          setPagination((prev) => ({ ...prev, itemsPerPage: size }));
        }}
        pageSizeOptions={[6, 12, 24, 36]}
      />

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategoryId ? t('edit') : t('create')} {t('category')}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('title')}</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.title}
                  onChange={(e) => setCategoryFormData({ title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder={t('categoryTitle') || 'Category title'}
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {editingCategoryId ? t('update') : t('save')}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCategoryCancel} disabled={submitting}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage(): React.ReactElement {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gallery</h1>
            <p className="text-gray-600">Loading gallery...</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <GalleryPageContent />
    </Suspense>
  );
}
