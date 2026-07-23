'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '../../../components/ui/Button';
import { getAllUsersPaginated, deleteUser, updateUser, User } from '../../../services/Users';
import { toast } from 'sonner';
import { useI18n } from '../../../components/i18n/LanguageProvider';
import { useConfirmDialog } from '../../../components/common/ConfirmDialogProvider';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function UsersPage(): React.ReactElement {
  const { t, lang } = useI18n();
  const confirmDialog = useConfirmDialog();
  const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUsersPaginated({
        page: currentPage,
        limit: pagination.itemsPerPage,
        searchTerm: searchTerm || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
      });

      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.message || t('failedToFetchUsers'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('failedToFetchUsers');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterRole, pagination.itemsPerPage, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: t('delete'),
      description: t('deleteUserConfirm'),
      confirmText: t('delete'),
      cancelText: t('cancel'),
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    try {
      const response = await deleteUser(id);
      if (response.success) {
        toast.success(t('userDeleted'));
        loadUsers();
      } else {
        toast.error(response.message || t('failedToDeleteUser'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('failedToDeleteUser');
      toast.error(message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const updateData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };

    try {
      const response = await updateUser(editingUser._id, updateData);
      if (response.success) {
        toast.success(t('userUpdated'));
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      } else {
        toast.error(response.message || t('failedToUpdateUser'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('failedToUpdateUser');
      toast.error(message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('users')}</h1>
          <p className="text-gray-600">{t('manageAllUsers')}</p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/admin-users/new'}>
          {t('createAdmin')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchByEmail')}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto rounded-lg border px-3 py-2"
            >
              <option value="all">{t('allRoles')}</option>
              <option value="admin">{t('adminRole')}</option>
              <option value="editor">{t('editorRole')}</option>
              <option value="user">{t('userRole')}</option>
            </select>
          </div>
          <Button type="submit">{t('search')}</Button>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-gray-500">{t('loading')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 pr-4">{t('email')}</th>
                    <th className="py-3 pr-4">{t('name')}</th>
                    <th className="py-3 pr-4">{t('role')}</th>
                    <th className="py-3 pr-4">{t('createdAt')}</th>
                    <th className="py-3 pr-4">{t('totalDonate')}</th>
                    <th className="py-3 pr-4">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        {t('noUsersFound')}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="border-t">
                        <td className="py-3 pr-4">{user.email}</td>
                        <td className="py-3 pr-4">{user.fullName || t('notAvailable')}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                            {(user as any).role === 'admin' ? t('adminRole') : 
                             (user as any).role === 'editor' ? t('editorRole') : 
                             t('userRole')}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{formatDate(user.createdAt)}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency((user as any).totalDonate || 0)}
                        </td>
                        <td className="py-3 pr-4 space-x-2">
                          <Button
                            onClick={() => handleEdit(user)}
                            variant="secondary"
                            size="sm"
                          >
                            {t('update')}
                          </Button>
                          <Button
                            onClick={() => handleDelete(user._id)}
                            variant="danger"
                            size="sm"
                          >
                            {t('delete')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {t('showing')} {(currentPage - 1) * pagination.itemsPerPage + 1} {t('to')}{' '}
                  {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} {t('of')}{' '}
                  {pagination.totalItems} {t('users')}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {t('previous')}
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={currentPage === pagination.totalPages}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">{t('updateUser')}</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('name')}</label>
                  <input
                    type="text"
                    name="fullName"
                    defaultValue={editingUser.fullName}
                    required
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('email')}</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    required
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('role')}</label>
                  <select
                    name="role"
                    defaultValue={(editingUser as any).role || 'user'}
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="user">{t('userRole')}</option>
                    <option value="editor">{t('editorRole')}</option>
                    <option value="admin">{t('adminRole')}</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('update')}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

