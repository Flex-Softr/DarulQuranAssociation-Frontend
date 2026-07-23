'use client';

import React from 'react';
import Button from '../../../../components/ui/Button';
import { createAdminUser } from '../../../../services/Users';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersNew(): React.ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await createAdminUser({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response.success) {
        toast.success('Admin user created successfully');
        router.push('/dashboard/users');
      } else {
        toast.error(response.message || 'Failed to create admin user');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin user';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Admin User</h1>
        <p className="text-gray-600">Add a new admin or editor user to the system</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm max-w-2xl">
        <h2 className="text-xl font-semibold mb-3">Create Admin User</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Full name"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="email@example.com"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="••••••••"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
              disabled={submitting}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={handleReset} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

