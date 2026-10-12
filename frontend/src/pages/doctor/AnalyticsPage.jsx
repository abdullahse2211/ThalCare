/**
 * ThalCare Doctor Analytics Page
 * Comprehensive analytics and insights
 */

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard, Spinner, Select } from '../../components/common';
import { CHART_COLORS, RISK_CATEGORY_LABELS } from '../../constants';
import { analyticsAPI } from '../../api/endpoints';
import { toast } from 'react-hot-toast';


export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPredictions: 0,
    averageAccuracy: 0,
    dnaTestsRecommended: 0
  });
  const [trends, setTrends] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [modelMetrics, setModelMetrics] = useState([]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [statsData, trendsData, riskData, ageData, metricsData] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getPredictionTrends({ range: dateRange }),
        analyticsAPI.getRiskDistribution(),
        analyticsAPI.getAgeDistribution(),
        analyticsAPI.getModelMetrics(),
      ]);

      setStats({
        totalPatients: statsData.totalPatients,
        totalPredictions: statsData.totalPredictions,
        averageAccuracy: statsData.accuracyRate,
        dnaTestsRecommended: statsData.dnaTestsRecommended
      });
      setTrends(trendsData);
      setRiskDistribution(riskData);
      setAgeDistribution(ageData);
      setModelMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load real-time analytics. Using local data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchAnalytics();
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Comprehensive insights and statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: '1y', label: 'Last Year' },
              { value: 'all', label: 'All Time' },
            ]}
            className="w-40"
          />
          <button onClick={handleRefresh} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          trend="up"
          trendValue="Live from database"
        />
        <StatCard
          title="Total Predictions"
          value={stats.totalPredictions.toLocaleString()}
          icon={<Activity className="w-6 h-6" />}
          trend="up"
          trendValue="8% from last month"
        />
        <StatCard
          title="Model Accuracy"
          value={`${stats.averageAccuracy}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
          trendValue="2.2% improvement"
        />
        <StatCard
          title="DNA Tests Recommended"
          value={stats.dnaTestsRecommended.toLocaleString()}
          icon={<Calendar className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
          </CardHeader>
          <CardBody>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
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
            <div className="flex items-center">
              <div className="w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
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
              <div className="w-1/2 space-y-3">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Patient Age Distribution</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="age" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" fill={CHART_COLORS.primary} name="Male" />
                  <Bar dataKey="female" fill={CHART_COLORS.danger} name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="predictions" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Model Performance Over Time</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modelMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="version" stroke="#6b7280" fontSize={12} />
                  <YAxis domain={[80, 100]} stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                    labelFormatter={(label) => `Model ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke={CHART_COLORS.success}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {modelMetrics.map((item) => (
                <div key={item.version} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{item.version}</p>
                  <p className="font-bold text-green-600">{item.accuracy}%</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Parameter Comparison */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Key Parameter Comparison</h3>
            <p className="text-sm text-gray-500 mt-1">Carrier vs Normal Average Values</p>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
              Parameter averages will populate as diagnostic data is collected.
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
