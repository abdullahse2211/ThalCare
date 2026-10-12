/**
 * ThalCare Doctor Predictions Page
 * List and manage all predictions
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardBody, Badge, Spinner, Input, Select } from '../../components/common';
import { formatDate, formatRelativeTime } from '../../utils';
import { RISK_CATEGORY_LABELS } from '../../constants';
import { predictionAPI } from '../../api/endpoints';

// No mock data needed - now using real API results

export default function PredictionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
          search: search || undefined,
          risk: riskFilter || undefined,
          status: statusFilter || undefined,
        };
        const data = await predictionAPI.getAll(params);
        setPredictions(data);
      } catch (err) {
        console.error('Failed to fetch predictions:', err);
        setError('Failed to load predictions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [search, riskFilter, statusFilter, currentPage]);

  const getRiskBadge = (risk) => {
    const variants = {
      carrier: 'carrier',
      minor: 'minor',
      major: 'major',
      severe: 'severe',
      not_detected: 'default',
    };
    return (
      <Badge variant={variants[risk] || 'default'}>
        {RISK_CATEGORY_LABELS[risk] || risk}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalPages = Math.ceil(predictions.length / itemsPerPage);
  const paginatedPredictions = predictions.slice(
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
          <h1 className="text-2xl font-bold text-gray-900">Predictions</h1>
          <p className="text-gray-500 mt-1">
            View and manage ML prediction results
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (predictions.length > 0) {
                predictionAPI.downloadReport(predictions[0].id);
                toast.success('Exporting report...');
              } else {
                toast.error('No predictions to export');
              }
            }}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
            <p className="text-sm text-gray-500">Total Predictions</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {predictions.filter(p => p.status === 'pending_review').length}
            </p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {predictions.filter(p => ['major', 'severe'].includes(p.risk)).length}
            </p>
            <p className="text-sm text-gray-500">High Risk Cases</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {predictions.filter(p => p.dnaRecommended).length}
            </p>
            <p className="text-sm text-gray-500">DNA Recommended</p>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name..."
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
                label="Risk Level"
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Risk Levels' },
                  { value: 'not_detected', label: 'Not Detected' },
                  { value: 'carrier', label: 'Carrier' },
                  { value: 'minor', label: 'Minor' },
                  { value: 'major', label: 'Major' },
                  { value: 'severe', label: 'Severe' },
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'pending_review', label: 'Pending Review' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setRiskFilter('');
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

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {paginatedPredictions.length} of {predictions.length} predictions
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {paginatedPredictions.map((prediction) => (
          <Card key={prediction.id} className="hover:shadow-md transition-shadow">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${prediction.status === 'pending_review'
                    ? 'bg-yellow-100'
                    : 'bg-green-100'
                    }`}>
                    <Activity className={`w-6 h-6 ${prediction.status === 'pending_review'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                      }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/doctor/patients/${prediction.patientId}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {prediction.patientName}
                      </Link>
                      {prediction.status === 'pending_review' && (
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(prediction.createdAt)}
                      </span>
                      <span>Model v{prediction.modelVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    {getRiskBadge(prediction.risk)}
                    <p className={`text-sm mt-1 font-medium ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}% confidence
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {prediction.dnaRecommended && (
                      <div className="p-2 bg-orange-50 rounded-lg" title="DNA Testing Recommended">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                    <Link
                      to={`/doctor/predictions/${prediction.id}`}
                      className="btn-secondary btn-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${currentPage === pageNum
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {predictions.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No predictions found</h3>
            <p className="text-gray-500">
              {search || riskFilter || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Predictions will appear here after running ML analysis'}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
