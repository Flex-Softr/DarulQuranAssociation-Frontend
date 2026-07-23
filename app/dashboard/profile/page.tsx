'use client';

import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import PasswordForms from '../../../components/profile/PasswordForms';
import { updateUser, User } from '../../../services/Users';
import { getCurrentUserProfile } from '../../../services/Users/me';
import { toast } from 'sonner';

export default function AdminProfile(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getCurrentUserProfile();

        if (response.success && response.data) {
          setUser(response.data);
          setFormData({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
          });
        } else {
          toast.error(response.message || 'Failed to load profile');
        }
      } catch (error) {
        toast.error('Failed to load profile');
      }
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User data not loaded');
      return;
    }

    setLoading(true);
    try {
      const updateData: { fullName?: string; phone?: string } = {};
      
      if (formData.fullName !== user.fullName) {
        updateData.fullName = formData.fullName;
      }
      
      if (formData.phone !== user.phone) {
        updateData.phone = formData.phone;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        setLoading(false);
        return;
      }
    //  console.log(updateData);
    //  console.log(user._id);
    //  console.log(user);
      const response = await updateUser(user.id as any, updateData);
      
      if (response.success) {
        toast.success(response.message || 'Profile updated successfully');
        // Update local user state with the response data
        if (response.data) {
          setUser(response.data);
        }
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile info */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Profile Information</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="fullName"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Admin Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full rounded-lg border px-3 py-2 bg-gray-100 cursor-not-allowed"
              placeholder="admin@example.com"
              value={formData.email}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="01xxxxxxxxx"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <Button variant="secondary" type="button" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Password update */}
      <div>
        <PasswordForms mode="change" />
      </div>
    </div>
  );
}


