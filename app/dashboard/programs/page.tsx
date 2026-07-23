'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import MediaUploader from '../../../components/common/MediaUploader';
import PaginationBar from '../../../components/admin/PaginationBar';
import { getAllPrograms, getProgramById } from '../../../services/programs';
import { createProgram, deleteProgram, updateProgram } from '../../../services/programs/mutations';
import { toast } from 'sonner';
import { generateSlug } from '../../../lib/validations/program';
import { getImageUrl } from '../../../lib/imageUtils';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';
import { PaginationInfo } from '../../../types/pagination';

const initialForm: any = {
  title: '',
  subtitle: '',
  thumbnail: '',
  video: '',
  description: '',
  media: [],
  slug: '',
  area: null,
  duration: null,
  beneficiary: [],
  expenseCategory: [],
  projectGoalsAndObjectives: [],
  activities: [],
};

type MediaValue = string | File;

const normalizeSingle = (value: MediaValue | MediaValue[] | '' | undefined): MediaValue => {
  if (Array.isArray(value)) {
    return (value[0] ?? '') as MediaValue;
  }
  return (value ?? '') as MediaValue;
};

const normalizeMultiple = (val: MediaValue | MediaValue[] | '' | undefined): MediaValue[] => {
  if (Array.isArray(val)) return val;
  if (val === '' || val === undefined) return [];
  return [val];
};

export default function ProgramsPage(): React.ReactElement {
  const { t } = useI18n();
  const confirmDialog = useConfirmDialog();
  const [programs, setPrograms] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [arrayInputs, setArrayInputs] = useState<{
    beneficiary: string;
    expenseCategory: string;
    projectGoalsAndObjectives: string;
    activities: string;
  }>({
    beneficiary: '',
    expenseCategory: '',
    projectGoalsAndObjectives: '',
    activities: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [pageSize, setPageSize] = useState(10);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllPrograms({
        page: currentPage,
        limit: pageSize,
      });
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        setPrograms(data);
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
    void loadPrograms();
  }, [loadPrograms]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setArrayInputs({
      beneficiary: '',
      expenseCategory: '',
      projectGoalsAndObjectives: '',
      activities: '',
    });
  };

  const handleSlugGenerate = () => {
    if (formData.title) {
      setFormData({ ...formData, slug: generateSlug(formData.title) });
    }
  };

  const handleAddArrayItem = (field: 'beneficiary' | 'expenseCategory' | 'projectGoalsAndObjectives' | 'activities') => {
    const value = arrayInputs[field].trim();
    if (!value) return;

    setFormData({
      ...formData,
      [field]: [...(formData[field] || []), value],
    });
    setArrayInputs({ ...arrayInputs, [field]: '' });
  };

  const handleRemoveArrayItem = (field: 'beneficiary' | 'expenseCategory' | 'projectGoalsAndObjectives' | 'activities', index: number) => {
    const current = formData[field] || [];
    setFormData({
      ...formData,
      [field]: current.filter((_: any, i: number) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateProgram(editingId, formData);
        toast.success(t('programUpdated'));
      } else {
        await createProgram(formData);
        toast.success(t('programCreated'));
      }
      resetForm();
      setShowForm(false);
      await loadPrograms();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('operationFailed');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (program: any) => {
    if (!program.id) {
      toast.error(t('programIdMissing'));
      return;
    }

    try {
      // Fetch full program data to ensure we have all fields
      const response = await getProgramById(program.id);
      const fullProgram = response.success && response.data ? response.data : program;

      // Ensure media arrays are properly formatted
      const mediaArray = Array.isArray(fullProgram.media) 
        ? fullProgram.media.map((m: any) => {
            if (typeof m === 'string') {
              // If it's already a data URL or full URL, use it as is
              if (m.startsWith('data:') || m.startsWith('http://') || m.startsWith('https://') || m.startsWith('blob:')) {
                return m;
              }
              // Otherwise, convert to proper URL
              return getImageUrl(m);
            }
            return m;
          })
        : [];
      
      setFormData({
        title: fullProgram.title || '',
        subtitle: fullProgram.subtitle || '',
        thumbnail: fullProgram.thumbnail 
          ? (fullProgram.thumbnail.startsWith('data:') || fullProgram.thumbnail.startsWith('http://') || fullProgram.thumbnail.startsWith('https://') || fullProgram.thumbnail.startsWith('blob:')
            ? fullProgram.thumbnail 
            : getImageUrl(fullProgram.thumbnail))
          : '',
        video: fullProgram.video || '',
        description: fullProgram.description || '',
        media: mediaArray,
        slug: fullProgram.slug || '',
        area: fullProgram.area ?? null,
        duration: fullProgram.duration ?? null,
        beneficiary: Array.isArray(fullProgram.beneficiary) ? fullProgram.beneficiary : [],
        expenseCategory: Array.isArray(fullProgram.expenseCategory) ? fullProgram.expenseCategory : [],
        projectGoalsAndObjectives: Array.isArray(fullProgram.projectGoalsAndObjectives) ? fullProgram.projectGoalsAndObjectives : [],
        activities: Array.isArray(fullProgram.activities) ? fullProgram.activities : [],
      });
      
      // Reset array inputs when editing
      setArrayInputs({
        beneficiary: '',
        expenseCategory: '',
        projectGoalsAndObjectives: '',
        activities: '',
      });
      
      setEditingId(fullProgram.id ?? null);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading program for edit:', error);
      toast.error(t('failedToLoadProgram'));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteProgramConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await deleteProgram(id);
      toast.success(t('programDeleted'));
      await loadPrograms();
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
          <h1 className="text-2xl font-semibold">{t('programs')}</h1>
          <p className="text-gray-600">{t('managePrograms')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); }}>
          {t('addProgram')}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? t('editProgram') : t('addProgram')}</h2>
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
                <label className="block text-sm font-medium mb-1">{t('thumbnail')} {t('required')}</label>
                <MediaUploader
                  value={formData.thumbnail}
                  onChange={(val) => setFormData({ ...formData, thumbnail: normalizeSingle(val) })}
                  accept="image/*"
                  label={t('uploadThumbnail')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('mediaImages')} {t('required')}</label>
                <MediaUploader
                  multiple
                  value={formData.media}
                  onChange={(val) => setFormData({ ...formData, media: normalizeMultiple(val) })}
                  accept="image/*"
                  label={t('uploadImages')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('area')}</label>
                <input
                  type="text"
                  value={formData.area || ''}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value || null })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('duration')}</label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value || null })}
                  className="w-full rounded-lg border px-3 py-2"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Array Fields */}
            {(['beneficiary', 'expenseCategory', 'projectGoalsAndObjectives', 'activities'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">
                  {field === 'beneficiary' ? t('beneficiary') :
                   field === 'expenseCategory' ? t('expenseCategory') :
                   field === 'projectGoalsAndObjectives' ? t('projectGoalsAndObjectives') :
                   t('activities')}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={arrayInputs[field]}
                    onChange={(e) => setArrayInputs({ ...arrayInputs, [field]: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArrayItem(field);
                      }
                    }}
                    className="flex-1 rounded-lg border px-3 py-2"
                    placeholder={
                      field === 'beneficiary' ? t('addBeneficiary') :
                      field === 'expenseCategory' ? t('addExpenseCategory') :
                      field === 'projectGoalsAndObjectives' ? t('addProjectGoal') :
                      t('addActivityItem')
                    }
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddArrayItem(field)}
                    variant="secondary"
                    disabled={submitting}
                  >
                    {t('add')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData[field] || []).map((item: any, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem(field, index)}
                        className="hover:text-emerald-900"
                        disabled={submitting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}

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
        <h3 className="font-semibold mb-3">{t('programsList')}</h3>
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
                  <th className="py-2 pr-4">{t('thumbnail')}</th>
                  <th className="py-2 pr-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">{t('noProgramsYet')}</td>
                  </tr>
                ) : (
                  programs.map((program) => (
                    <tr key={program.id} className="border-t">
                      <td className="py-2 pr-4">{program.title.slice(0,40)}...</td>
                      <td className="py-2 pr-4">{program.subtitle.slice(0,40)}...</td>
                      <td className="py-2 pr-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{program.slug}</code>
                      </td>
                      <td className="py-2 pr-4">
                        {program.thumbnail ? (
                          <img src={getImageUrl(program.thumbnail)} alt={program.title} className="h-10 w-16 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-gray-400">{t('notAvailable')}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 space-x-2">
                        <Button onClick={() => handleEdit(program)} variant="secondary" size="sm" disabled={submitting}>{t('edit')}</Button>
                        {program.id && (
                          <Button onClick={() => handleDelete(program.id!)} variant="danger" size="sm" disabled={submitting}>{t('delete')}</Button>
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
        entityLabel={t('programs')}
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

