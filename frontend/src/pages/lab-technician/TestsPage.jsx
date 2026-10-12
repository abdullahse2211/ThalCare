/**
 * ThalCare Lab Technician Tests Page
 * List and manage all test entries
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card, CardBody, Badge, Spinner, Input, Select } from '../../components/common';
import { formatDate, formatRelativeTime } from '../../utils';
import { TEST_STATUS_LABELS, TEST_STATUS_COLORS } from '../../constants';

import { testAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

export default function LabTestsPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [totalCounts, setTotalCounts] = useState({
    total: 0, pending: 0, verified: 0, predicted: 0, finalized: 0
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const data = await testAPI.getAll({ limit: 200 });
        let all = Array.isArray(data) ? data : [];

        // Update counts from real data
        setTotalCounts({
          total: all.length,
          pending: all.filter(t => t.status === 'PENDING').length,
          verified: all.filter(t => t.status === 'VERIFIED').length,
          predicted: all.filter(t => t.status === 'PREDICTION_DONE').length,
          finalized: all.filter(t => t.status === 'COMPLETED').length,
        });

        // Apply filters
        if (search) {
          const q = search.toLowerCase();
          all = all.filter(t => 
            (t.patient_name || '').toLowerCase().includes(q) ||
            (t.patient_cnic || '').toLowerCase().includes(q)
          );
        }
        if (statusFilter) {
          all = all.filter(t => t.status === statusFilter.toUpperCase());
        }

        setTests(all);
      } catch (err) {
        toast.error('Failed to load tests from server');
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, [search, statusFilter]);

  const getStatusBadge = (status) => {
    const colors = TEST_STATUS_COLORS[status] || TEST_STATUS_COLORS.pending;
    return (
      <Badge className={`${colors.bg} ${colors.text}`}>
        {TEST_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'prediction_done':
      case 'finalized':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const totalPages = Math.ceil(tests.length / itemsPerPage);
  const paginatedTests = tests.slice(
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
          <h1 className="text-2xl font-bold text-gray-900">Test Records</h1>
          <p className="text-gray-500 mt-1">
            View and manage all test entries
          </p>
        </div>
        <Link to="/lab/tests/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Enter New Test
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { status: '', label: 'Total', count: totalCounts.total },
          { status: 'PENDING', label: 'Pending', count: totalCounts.pending },
          { status: 'VERIFIED', label: 'Verified', count: totalCounts.verified },
          { status: 'PREDICTION_DONE', label: 'Predicted', count: totalCounts.predicted },
          { status: 'COMPLETED', label: 'Finalized', count: totalCounts.finalized },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              statusFilter === stat.status ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => {
              setStatusFilter(stat.status);
              setCurrentPage(1);
            }}
          >
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name or CNIC..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'prediction_done', label: 'Prediction Done' },
                  { value: 'finalized', label: 'Finalized' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-500">
        Showing {paginatedTests.length} of {tests.length} tests
      </div>

      {/* Tests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Test Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{test.patient_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-gray-500">{test.patient_mrn || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default">CBC</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status?.toLowerCase())}
                      {getStatusBadge(test.status?.toLowerCase())}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeTime(test.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/lab/tests/${test.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {test.status === 'pending' && (
                        <Link
                          to={`/lab/tests/${test.id}`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
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
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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
      {tests.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter ? 'Try adjusting your filters' : 'Start by entering new test data'}
            </p>
            <Link to="/lab/tests/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Enter New Test
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
