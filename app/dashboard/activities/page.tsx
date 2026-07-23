'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import { Activity, ActivityInput, getAllActivities } from '../../../services/activities';
import { createActivity, deleteActivity, updateActivity } from '../../../services/activities/mutations';
import { toast } from 'sonner';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

const initialForm: ActivityInput = {
  title: '',
  tag: '',
  description: '',
  image: '',
  thumbnail: '',
};

type MediaValue = string | File;

const normalizeSingle = (value: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(value)) {
    return (value[0] ?? '') as MediaValue;
  }
  return (value ?? '') as MediaValue;
};

export default function ActivitiesPage() {
  const { t } = useI18n();
  const confirmDialog = useConfirmDialog();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formData, setFormData] = useState<ActivityInput>(initialForm);
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

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllActivities({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setActivities(data);
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
    void loadActivities();
  }, [loadActivities]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateActivity(editingId, formData);
        toast.success(t('activityUpdated'));
      } else {
        await createActivity(formData);
        toast.success(t('activityCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadActivities();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      title: activity.title,
      tag: activity.tag,
      description: activity.description,
      image: activity.image,
      thumbnail: activity.thumbnail,
    });
    setEditingId(activity.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteActivityConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteActivity(id);
      toast.success(t('activityDeleted'));
      await loadActivities();
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
          <h1 className="text-2xl font-semibold">{t('activities')}</h1>
          <p className="text-gray-600">{t('manageActivities')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addActivity')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editActivity') : t('addActivity')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">{t('tag')}</label>
              <input
                type="text"
                required
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('description')}</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={4}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('imageUrl')}</label>
              <MediaUploader
                value={formData.image}
                onChange={(val) => setFormData({ ...formData, image: normalizeSingle(val) })}
                accept="image/*"
                label={t('uploadImage')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('thumbnail')}</label>
              <MediaUploader
                value={formData.thumbnail}
                onChange={(val) => setFormData({ ...formData, thumbnail: normalizeSingle(val) })}
                accept="image/*"
                label={t('uploadThumbnail')}
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
        <h3 className="font-semibold mb-3">{t('activitiesList')}</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('tag')}</th>
                  <th className="py-2 pr-4">{t('description')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">{t('noActivitiesYet')}</td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="border-t">
                      <td className="py-2 pr-4">{activity.title}</td>
                      <td className="py-2 pr-4">{activity.tag}</td>
                      <td className="py-2 pr-4">{activity.description.substring(0, 50)}...</td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(activity)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {activity.id && (
                          <Button onClick={() => handleDelete(activity.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
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
        entityLabel={t('activities')}
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
