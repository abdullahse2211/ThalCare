/**
 * ThalCare Doctor Dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody, Badge, StatCard, Spinner } from '../../components/common';
import { formatDate, formatRelativeTime } from '../../utils';
import { CHART_COLORS, RISK_CATEGORIES, RISK_CATEGORY_LABELS } from '../../constants';

import { analyticsAPI, patientAPI, predictionAPI, testAPI } from '../../api/endpoints';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingTests: 0,
    predictionsToday: 0,
    accuracyRate: 90.2, // Matches Phase 9.2 benchmark
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [pendingTests, setPendingTests] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsData, predsData, trendsData, riskData, pendingData] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          predictionAPI.getAll({ limit: 5 }),
          analyticsAPI.getPredictionTrends(),
          analyticsAPI.getRiskDistribution(),
          testAPI.getPending(),
        ]);

        setStats({
          totalPatients: statsData.totalPatients || 0,
          pendingTests: statsData.pendingTests || 0,
          predictionsToday: statsData.predictionsToday || 0,
          accuracyRate: statsData.accuracyRate || 90.2,
        });

        setRecentPredictions(Array.isArray(predsData) ? predsData : []);
        setPendingTests(Array.isArray(pendingData) ? pendingData.slice(0, 5) : []);
        setTrendData(trendsData || []);
        setRiskDistribution(riskData || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExport = () => {
    if (recentPredictions.length > 0) {
      predictionAPI.downloadReport(recentPredictions[0].id);
      toast.success('Exporting overview report...');
    } else {
      toast.error('No data available to export');
    }
  };

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
            Welcome back, Dr. {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your patients today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/doctor/patients/new"
            className="btn-primary"
          >
            + Add New Patient
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          trend="up"
          trendValue="12% from last month"
        />
        <StatCard
          title="Pending Tests"
          value={stats.pendingTests}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="Predictions Today"
          value={stats.predictionsToday}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="Model Accuracy"
          value={`${stats.accuracyRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
          trendValue="2.1% improvement"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="predictions"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.2}
                    name="Predictions"
                  />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke={CHART_COLORS.success}
                    fill={CHART_COLORS.success}
                    fillOpacity={0.2}
                    name="New Patients"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tests */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pending Tests</h3>
            <Link
              to="/doctor/patients"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {pendingTests.length > 0 ? pendingTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{test.patientName || 'Patient'}</p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(test.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/doctor/tests/${test.id}`}
                    className="btn-secondary btn-sm"
                  >
                    Review
                  </Link>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">No pending tests</div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Predictions */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
            <Link
              to="/doctor/predictions"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {recentPredictions.length > 0 ? recentPredictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{prediction.patientName}</p>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(prediction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getRiskBadge(prediction.risk)}
                    <p className="text-xs text-gray-500 mt-1">
                      {prediction.confidence}% confidence
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">No recent predictions</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
