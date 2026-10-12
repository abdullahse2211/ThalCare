/**
 * ThalCare Doctor Patients List Page
 * Shows all patients with View, Add Patient, and filter functionality
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  Eye, Activity, Calendar, User, Download,
} from 'lucide-react';
import { Card, CardBody, Badge, Spinner, Input, Select } from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { GENDER_OPTIONS } from '../../constants';
import { patientAPI } from '../../api/endpoints';

function getAge(dob) {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function PatientsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [allPatients, setAllPatients] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await patientAPI.getAll();
        const transformed = (Array.isArray(data) ? data : []).map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`.trim(),
          cnic: p.mrn || '',
          age: getAge(p.dob),
          gender: p.gender || 'male',
          bloodGroup: p.blood_group || 'N/A',
          phone: p.contact_number || '',
          createdAt: p.created_at,
          city: p.city || '',
        }));
        setAllPatients(transformed);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError('Could not load patients. Make sure the backend is running.');
        setAllPatients([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = [...allPatients];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.cnic.includes(search) ||
        p.phone.includes(search)
      );
    }
    if (genderFilter) {
      filtered = filtered.filter(p => p.gender === genderFilter);
    }
    setPatients(filtered);
    setCurrentPage(1);
  }, [search, genderFilter, allPatients]);

  const totalPages = Math.ceil(patients.length / itemsPerPage);
  const paginatedPatients = patients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">Manage and view all registered patients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (allPatients.length > 0) {
                toast.success('Exporting patients list...');
              } else {
                toast.error('No patients to export');
              }
            }}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <Link to="/doctor/patients/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add New Patient
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, CNIC, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {genderFilter && (
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">1</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <Select
                label="Gender"
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Genders' },
                  ...GENDER_OPTIONS,
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={() => { setGenderFilter(''); setSearch(''); }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Count */}
      <div className="text-sm text-gray-500">
        Showing {paginatedPatients.length} of {patients.length} patients
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Patient', 'CNIC', 'Age / Gender', 'Blood Group', 'City', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">{patient.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.cnic || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.age} yrs / {patient.gender === 'male' ? 'M' : 'F'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default" size="sm">{patient.bloodGroup}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.city || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeTime(patient.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/doctor/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        title="View Patient Details"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        to={`/doctor/patients/${patient.id}?tab=predictions`}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Predictions"
                      >
                        <Activity className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {patients.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-4">
              {search || genderFilter ? 'Try adjusting your filters' : 'Get started by adding your first patient'}
            </p>
            <Link to="/doctor/patients/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Add New Patient
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
