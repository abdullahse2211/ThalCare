/**
 * ThalCare Lab Technician New Patient Page
 * Simplified patient registration form
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, User, Phone } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Select, Spinner } from '../../components/common';
import { GENDER_OPTIONS, BLOOD_GROUPS } from '../../constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

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
const patientSchema = z.object({
  name: nameValidation('Name'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format: 35201-1234567-1'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (val) => new Date(val) <= new Date(),
      'Date of birth cannot be a future date'
    )
    .refine(
      (val) => new Date(val) >= new Date('1900-01-01'),
      'Please enter a valid date of birth'
    ),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  phone: z.string().regex(/^0\d{3}-\d{7}$/, 'Phone must be in format: 0300-1234567'),
  city: nameValidation('City'),
});

export default function LabNewPatientPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      cnic: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      phone: '',
      city: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        mrn: data.cnic,
        first_name: firstName,
        last_name: lastName,
        dob: new Date(data.dateOfBirth).toISOString(),
        gender: data.gender,
        blood_group: data.bloodGroup || null,
        contact_number: data.phone || null,
        city: data.city || null,
      };

      await patientAPI.create(payload);
      toast.success('Patient registered successfully!');
      navigate('/lab/patients');
    } catch (error) {
      console.error('Create patient error:', error);
      const msg = error?.message || 'Failed to register patient';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCNIC = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 11)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/lab/patients" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
          <p className="text-gray-500 mt-1">Enter patient details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Full Name"
                  placeholder="Enter patient's full name"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <Input
                label="CNIC"
                placeholder="35201-1234567-1"
                error={errors.cnic?.message}
                {...register('cnic', {
                  onChange: (e) => {
                    e.target.value = formatCNIC(e.target.value);
                  },
                })}
                maxLength={15}
              />
              {/* max={today} prevents browser date picker from selecting future dates */}
              <Input
                label="Date of Birth"
                type="date"
                max={today}
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
              <Select
                label="Gender"
                error={errors.gender?.message}
                {...register('gender')}
                options={[
                  { value: '', label: 'Select Gender' },
                  ...GENDER_OPTIONS,
                ]}
              />
              <Select
                label="Blood Group"
                error={errors.bloodGroup?.message}
                {...register('bloodGroup')}
                options={[
                  { value: '', label: 'Select Blood Group' },
                  ...BLOOD_GROUPS,
                ]}
              />
              <Input
                label="Phone Number"
                placeholder="0300-1234567"
                error={errors.phone?.message}
                {...register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  },
                })}
                maxLength={12}
              />
              <Input
                label="City"
                placeholder="Enter city"
                error={errors.city?.message}
                {...register('city')}
              />
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Link to="/lab/patients" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? (
              <><Spinner size="sm" className="mr-2" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Register Patient</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
