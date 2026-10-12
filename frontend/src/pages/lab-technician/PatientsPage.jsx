/**
 * ThalCare Lab Technician Patients Page
 * Register and manage patients - fetches from real backend API
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Card, CardBody, Badge, Spinner, Input } from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { patientAPI } from '../../api/endpoints';

export default function LabPatientsPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  // Fetch patients from backend
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
          phone: p.contact_number || '',
          age: p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          gender: p.gender || 'male',
          lastTest: p.updated_at || null,
          testsCount: 0,
          createdAt: p.created_at,
        }));
        setAllPatients(transformed);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Could not load patients from the server.");
        setAllPatients([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let filtered = [...allPatients];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.cnic.includes(search) ||
        p.phone.includes(search)
      );
    }
    setPatients(filtered);
  }, [search, allPatients]);

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
          <p className="text-gray-500 mt-1">
            Register new patients and enter test data
          </p>
        </div>
        <Link to="/lab/patients/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Register New Patient
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardBody>
          <Input
            placeholder="Search by name, CNIC, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </CardBody>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-500">
        Showing {paginatedPatients.length} of {patients.length} patients
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.cnic}</p>
                  </div>
                </div>
                <Badge variant="default">
                  {patient.gender === 'male' ? 'M' : 'F'} • {patient.age}y
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{patient.testsCount} tests on record</span>
                </div>
                {patient.lastTest && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Last test: {formatRelativeTime(patient.lastTest)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Link
                  to={`/lab/tests/new?patientId=${patient.id}`}
                  className="flex-1 btn-primary btn-sm text-center"
                >
                  Enter Test Data
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {patients.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Try adjusting your search' : 'Register your first patient'}
            </p>
            <Link to="/lab/patients/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Register New Patient
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
