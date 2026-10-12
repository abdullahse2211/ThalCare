/**
 * ThalCare Lab Technician Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Upload,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody, Badge, StatCard, Spinner } from '../../components/common';
import { formatDate, formatRelativeTime } from '../../utils';
import { TEST_STATUS, TEST_STATUS_LABELS, TEST_STATUS_COLORS } from '../../constants';

import { testAPI, analyticsAPI } from '../../api/endpoints';

export default function LabTechnicianDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ testsToday: 0, pendingApprovals: 0, totalUploads: 0 });
  const [recentTests, setRecentTests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, testsData] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          testAPI.getAll({ limit: 5 }),
        ]);
        setStats({
          testsToday: statsData.predictionsToday || 0,
          pendingApprovals: statsData.pendingTests || 0,
          totalUploads: (testsData || []).length,
        });
        setRecentTests(Array.isArray(testsData) ? testsData.slice(0, 5) : []);
      } catch (err) {
        console.error('Lab dashboard load failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const colors = TEST_STATUS_COLORS[status] || TEST_STATUS_COLORS.pending;
    return (
      <Badge className={`${colors.bg} ${colors.text}`}>
        {TEST_STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Manage patient registrations and test uploads.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/lab/patients">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Register New Patient</h3>
                <p className="text-gray-500 text-sm">Add new patient and enter test data</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/lab/upload">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Reports</h3>
                <p className="text-gray-500 text-sm">Upload CBC/HPLC report files</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tests Entered Today"
          value={stats.testsToday}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="Total Uploads"
          value={stats.totalUploads}
          icon={<Upload className="w-6 h-6" />}
        />
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Test Entries</h3>
          <Link
            to="/lab/tests"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {(test.patient_name || 'U').charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{test.patient_name || 'Unknown Patient'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeTime(test.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(test.status?.toLowerCase())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/lab/tests/${test.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardBody className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Important Note</h4>
            <p className="text-sm text-blue-700 mt-1">
              Please verify all CBC/HPLC values before submitting. Once submitted,
              the data will be sent to the doctor for review and prediction.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
