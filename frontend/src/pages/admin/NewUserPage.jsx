/**
 * ThalCare Admin New User Page
 * Create or edit a user
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, Eye, EyeOff,
  User, Mail, Phone, Shield, Lock,
} from 'lucide-react';
import {
  Card, CardBody, CardHeader, CardFooter,
  Input, Select, Button, Spinner, Alert,
} from '../../components/common';
import { adminAPI } from '../../api/endpoints';

// ── Name helper ───────────────────────────────────────────────────────────────
const nameValidation = (label) =>
  z
    .string()
    .min(3, `${label} must be at least 3 characters`)
    .max(50, `${label} is too long`)
    .refine(
      (val) => !/^\d+$/.test(val.trim()),
      `${label} cannot be only numbers`
    )
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      `${label} must contain at least one letter`
    );

// Validation schema
const userSchema = z
  .object({
    name: nameValidation('Full name'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(11, 'Phone number must be at least 11 digits'),
    role: z.enum(['doctor', 'lab_technician', 'admin'], {
      required_error: 'Please select a role',
    }),
    department: z.string().min(1, 'Department is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    confirmPassword: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== data.confirmPassword) return false;
      return true;
    },
    { message: "Passwords don't match", path: ['confirmPassword'] }
  );

export default function NewUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const users = await adminAPI.getUsers();
          const user = users.find((u) => u.id === parseInt(id));
          if (user) {
            reset({
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              phone: user.phone || '',
              role: user.role,
              department: user.department || 'General',
              isActive: user.is_active,
              password: '',
              confirmPassword: '',
            });
          } else {
            setSubmitError('User not found');
          }
        } catch {
          setSubmitError('Failed to load user data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const nameParts = data.name.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || '';

      const apiData = {
        email: data.email,
        first_name,
        last_name,
        role: data.role.toUpperCase(),
        is_active: data.isActive,
        department: data.department,
        phone: data.phone,
      };
      if (data.password) apiData.password = data.password;

      if (isEditMode) {
        await adminAPI.updateUser(id, apiData);
      } else {
        if (!data.password) throw new Error('Password is required for new users');
        await adminAPI.createUser(apiData);
      }

      setSubmitSuccess(true);
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Failed to save user';
      setSubmitError(Array.isArray(msg) ? msg[0].msg : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.startsWith('92')) value = '+' + value;
      else if (!value.startsWith('+')) value = '+92 ' + value;
    }
    e.target.value = value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update user information and permissions' : 'Create a new user account'}
          </p>
        </div>
      </div>

      {submitSuccess && (
        <Alert variant="success">
          User {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}
      {submitError && <Alert variant="error">{submitError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
          </CardHeader>

          <CardBody className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Select
                  label="Department"
                  error={errors.department?.message}
                  {...register('department')}
                  options={[
                    { value: '', label: 'Select Department' },
                    { value: 'Hematology', label: 'Hematology' },
                    { value: 'Pathology', label: 'Pathology' },
                    { value: 'Laboratory', label: 'Laboratory' },
                    { value: 'General', label: 'General Medicine' },
                    { value: 'Pediatrics', label: 'Pediatrics' },
                    { value: 'IT', label: 'IT Department' },
                    { value: 'Administration', label: 'Administration' },
                  ]}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  leftIcon={<Mail className="w-4 h-4" />}
                  {...register('email')}
                />
                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="+92 300 1234567"
                  error={errors.phone?.message}
                  leftIcon={<Phone className="w-4 h-4" />}
                  {...register('phone')}
                  onChange={formatPhoneNumber}
                />
              </div>
            </div>

            {/* Role and Permissions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role & Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="User Role"
                  error={errors.role?.message}
                  {...register('role')}
                  options={[
                    { value: '', label: 'Select Role' },
                    { value: 'doctor', label: 'Doctor' },
                    { value: 'lab_technician', label: 'Lab Technician' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...register('isActive')} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Account Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Role Permissions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {watch('role') === 'doctor' && (
                    <>
                      <li>• View and manage patients</li>
                      <li>• View test results and predictions</li>
                      <li>• Access analytics dashboard</li>
                      <li>• Download reports</li>
                    </>
                  )}
                  {watch('role') === 'lab_technician' && (
                    <>
                      <li>• Register new patients</li>
                      <li>• Enter CBC/HPLC test data</li>
                      <li>• Upload test reports</li>
                      <li>• View pending tests</li>
                    </>
                  )}
                  {watch('role') === 'admin' && (
                    <>
                      <li>• Full system access</li>
                      <li>• Manage users and permissions</li>
                      <li>• Configure system settings</li>
                      <li>• View audit logs</li>
                    </>
                  )}
                  {!watch('role') && (
                    <li className="text-gray-400">Select a role to see permissions</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {isEditMode ? 'Change Password (Optional)' : 'Set Password'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label={isEditMode ? 'New Password' : 'Password'}
                    placeholder="Enter password"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Password must be at least 8 characters long
              </p>
            </div>
          </CardBody>

          <CardFooter className="flex justify-end gap-3">
            <Link to="/admin/users" className="btn-secondary">Cancel</Link>
            <Button type="submit" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
