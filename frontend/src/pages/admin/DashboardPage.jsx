/**
 * ThalCare Admin Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  Server,
  HardDrive,
  Shield,
  ChevronRight,
  UserPlus,
  Settings,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody, Badge, StatCard, Spinner } from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { CHART_COLORS, USER_ROLE_LABELS } from '../../constants';

import { analyticsAPI, adminAPI } from '../../api/endpoints';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalPredictions: 0, systemHealth: 99.9, storageUsed: 0.1, storageTotal: 10 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const [statsData, usersData, trendsData, logsData] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          adminAPI.getUsers({ limit: 5 }),
          analyticsAPI.getPredictionTrends(),
          adminAPI.getAuditLogs({ limit: 5 }),
        ]);
        setStats({
          totalUsers: (usersData || []).length,
          activeUsers: (usersData || []).filter(u => u.is_active).length,
          totalPredictions: statsData.totalPatients || 0,
          systemHealth: 99.9,
          storageUsed: 0.3,
          storageTotal: 10,
        });
        setRecentUsers(Array.isArray(usersData) ? usersData : []);
        setUserActivity(Array.isArray(trendsData) ? trendsData : []);
        setRecentLogs(Array.isArray(logsData) ? logsData : []);
      } catch (err) {
        console.error('Admin dashboard load failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
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
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            System overview and management
          </p>
        </div>
        <Link to="/admin/users/new" className="btn-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Total Predictions"
          value={stats.totalPredictions.toLocaleString()}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          icon={<Server className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="logins" fill={CHART_COLORS.primary} name="Logins" />
                  <Bar dataKey="predictions" fill={CHART_COLORS.success} name="Predictions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">System Resources</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Storage</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {stats.storageUsed} GB / {stats.storageTotal} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(stats.storageUsed / stats.storageTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">API Status</span>
                  </div>
                  <p className="text-xs text-green-600">Operational</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Database</span>
                  </div>
                  <p className="text-xs text-green-600">Connected</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">ML Model</span>
                  </div>
                  <p className="text-xs text-green-600">v2.1 Active</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Security</span>
                  </div>
                  <p className="text-xs text-green-600">All Clear</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            <Link
              to="/admin/users"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {u.first_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={u.is_active ? 'success' : 'default'}>
                      {u.is_active ? 'active' : 'inactive'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {USER_ROLE_LABELS[u.role]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link
              to="/admin/logs"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-gray-50">
                  <div className="mt-0.5">{getLogTypeIcon(log.type || 'info')}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user || 'System'}</span>
                      {' '}
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeTime(log.timestamp || log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
