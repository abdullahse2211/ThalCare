/**
 * ThalCare Login Page
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Activity, Loader2 } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
import { Input, Button, Alert } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        // Redirect based on user role
        // NOTE: Routes are /doctor, /lab, /admin (dashboard is index route)
        const roleRedirects = {
          doctor: '/doctor',
          lab_technician: '/lab',
          admin: '/admin',
        };
        const redirectPath = roleRedirects[result.user.role] || from;
        navigate(redirectPath, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ThalCare</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Alpha Thalassemia Detection System
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            AI-powered detection of Alpha Thalassemia through CBC/HPLC analysis.
            Early detection saves lives.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🧬</span>
            </div>
            <div>
              <h3 className="text-white font-medium">ML-Powered Analysis</h3>
              <p className="text-primary-200 text-sm">Accurate gene mutation prediction</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="text-white font-medium">Fast Results</h3>
              <p className="text-primary-200 text-sm">Get predictions in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h3 className="text-white font-medium">Secure & Private</h3>
              <p className="text-primary-200 text-sm">HIPAA compliant data protection</p>
            </div>
          </div>
        </div>

        <p className="text-primary-200 text-sm">
          © 2024 ThalCare. Lahore Garrison University.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ThalCare</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
            </div>

            {authError && (
              <Alert variant="error" className="mb-6">
                {authError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                id="login-email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <Input
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  }
                  {...register('password')}
                />
                <div className="flex justify-end mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><strong>Doctor:</strong> doctor@thalcare.com / password123</p>
                <p><strong>Lab Tech:</strong> lab@thalcare.com / password123</p>
                <p><strong>Admin:</strong> admin@thalcare.com / password123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
