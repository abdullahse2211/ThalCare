/**
 * ThalCare - User Profile Page
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Badge,
  Avatar,
} from '../../components/common';
import { USER_ROLE_LABELS } from '../../constants';

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account information and security settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardBody className="flex items-center gap-6">
          <Avatar name={user?.name} size="xl" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.name}
            </h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2">
              <Badge variant="primary">
                {USER_ROLE_LABELS[user?.role] || user?.role}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                leftIcon={<User className="w-4 h-4" />}
                error={profileErrors.name?.message}
                {...registerProfile('name')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={profileErrors.email?.message}
                disabled
                {...registerProfile('email')}
              />
            </div>
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              helperText="Optional - for account recovery"
              {...registerProfile('phone')}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdatingProfile}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Security Settings
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.newPassword?.message}
                  {...registerPassword('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isChangingPassword}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Account Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardBody>
          <div className="text-sm text-gray-500">
            <p>
              <strong>Account Created:</strong>{' '}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p className="mt-1">
              <strong>Last Login:</strong>{' '}
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
