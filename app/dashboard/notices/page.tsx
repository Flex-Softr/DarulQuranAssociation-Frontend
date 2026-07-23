'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import PaginationBar from '../../../components/admin/PaginationBar';
import { Notice, createNotice, deleteNotice, getAllNotices, updateNotice } from '../../../services/notices';
import { toast } from 'sonner';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

const initialForm: Omit<Notice, 'id'> = {
  title: '',
  subTitle: '',
  date: '',
  category: '',
  fullContent: '',
};

export default function NoticesPage(): React.ReactElement {
  const { t, lang } = useI18n();
  const confirmDialog = useConfirmDialog();
  const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
  const [notices, setNotices] = useState<Notice[]>([]);
  const [formData, setFormData] = useState(initialForm);
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

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllNotices({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setNotices(data);
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
    void loadNotices();
  }, [loadNotices]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateNotice(editingId, formData);
        toast.success(t('noticeUpdated'));
      } else {
        await createNotice(formData);
        toast.success(t('noticeCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadNotices();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setFormData({
      title: notice.title,
      subTitle: notice.subTitle,
      date: notice.date,
      category: notice.category,
      fullContent: notice.fullContent,
    });
    setEditingId(notice.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteNoticeConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteNotice(id);
      toast.success(t('noticeDeleted'));
      await loadNotices();
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
          <h1 className="text-2xl font-semibold">{t('notice')}</h1>
          <p className="text-gray-600">{t('manageNotices')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addNotice')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editNotice') : t('addNotice')}</h2>
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
                <label className="block text-sm font-medium mb-1">{t('subTitle')}</label>
                <input
                  type="text"
                  required
                  value={formData.subTitle}
                  onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('date')}</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('category')}</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('fullContent')}</label>
              <textarea
                required
                value={formData.fullContent}
                onChange={(e) => setFormData({ ...formData, fullContent: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={8}
                disabled={submitting}
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
        <h3 className="font-semibold mb-3">{t('noticesList')}</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('subTitle')}</th>
                  <th className="py-2 pr-4">{t('date')}</th>
                  <th className="py-2 pr-4">{t('category')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">{t('noNoticesYet')}</td>
                  </tr>
                ) : (
                  notices.map((notice) => (
                    <tr key={notice.id} className="border-t">
                      <td className="py-2 pr-4">{notice.title.slice(0,40)}...</td>
                      <td className="py-2 pr-4">{notice.subTitle.slice(0,40)}...</td>
                      <td className="py-2 pr-4">{notice.date}</td>
                      <td className="py-2 pr-4">{notice.category}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(notice)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {notice.id && (
                          <Button onClick={() => handleDelete(notice.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
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
        entityLabel={t('notice')}
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
