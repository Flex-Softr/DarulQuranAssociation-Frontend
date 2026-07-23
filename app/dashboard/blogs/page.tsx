'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import { Blog, BlogInput, createBlog, deleteBlog, getAllBlogs, updateBlog } from '../../../services/blogs/api';
import { toast } from 'sonner';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { getImageUrl } from '../../../lib/imageUtils';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

type MediaValue = string | File;

const initialForm: BlogInput = {
  title: '',
  excerpt: '',
  date: '',
  thumbnail: '',
  images: [],
  fullContent: '',
};

const normalizeSingle = (val: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(val)) {
    return (val[0] ?? '') as MediaValue;
  }
  return (val ?? '') as MediaValue;
};

const normalizeMultiple = (val: MediaValue | MediaValue[] | '' | undefined): MediaValue[] => {
  if (Array.isArray(val)) return val;
  if (val === '' || val === undefined) return [];
  return [val];
};

export default function BlogsPage(): React.ReactElement {
  const { t } = useI18n();
  const confirmDialog = useConfirmDialog();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [formData, setFormData] = useState<BlogInput>(initialForm);
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

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllBlogs({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setBlogs(data);
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
    void loadBlogs();
  }, [loadBlogs]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateBlog(editingId, formData);
        toast.success(t('blogUpdated'));
      } else {
        await createBlog(formData);
        toast.success(t('blogCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadBlogs();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      date: blog.date,
      thumbnail: blog.thumbnail ? getImageUrl(blog.thumbnail) : '',
      images: blog.images ? blog.images.map(img => getImageUrl(img)) : [],
      fullContent: blog.fullContent,
    });
    setEditingId(blog.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteBlogConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteBlog(id);
      toast.success(t('blogDeleted'));
      await loadBlogs();
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
          <h1 className="text-2xl font-semibold">{t('blog')}</h1>
          <p className="text-gray-600">{t('manageBlogPosts')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addBlog')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editBlog') : t('addBlog')}</h2>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('excerpt')}</label>
              <textarea
                required
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={3}
                disabled={submitting}
              />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail</label>
                <MediaUploader
                  value={formData.thumbnail}
                  onChange={(val) => setFormData({ ...formData, thumbnail: normalizeSingle(val) })}
                  accept="image/*"
                  label="Upload thumbnail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Images</label>
                <MediaUploader
                  multiple
                  value={formData.images}
                  onChange={(val) => setFormData({ ...formData, images: normalizeMultiple(val) })}
                  accept="image/*"
                  label="Upload images"
                />
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
        <h3 className="font-semibold mb-3">{t('blogsList')}</h3>
        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">{t('title')}</th>
                  <th className="py-2 pr-4">{t('date')}</th>
                  <th className="py-2 pr-4">Thumbnail</th>
                  <th className="py-2 pr-4">Image Count</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {blogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">{t('noBlogsYet')}</td>
                  </tr>
                ) : (
                  blogs.map((blog) => (
                    <tr key={blog.id} className="border-t">
                      <td className="py-2 pr-4">{blog.title.slice(0,40)}...</td>
                      <td className="py-2 pr-4">{blog.date}</td>
                      <td className="py-2 pr-4">
                        {blog.thumbnail ? (
                          <img src={getImageUrl(blog.thumbnail)} alt={blog.title} className="h-10 w-16 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-gray-400">{t('notAvailable')}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{blog.images.length}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(blog)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {blog.id && (
                          <Button onClick={() => handleDelete(blog.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
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
        entityLabel={t('blog')}
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
