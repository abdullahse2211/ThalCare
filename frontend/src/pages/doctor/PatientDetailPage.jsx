/**
 * ThalCare Doctor Patient Detail Page
 * Shows patient information, test history, and predictions
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Activity,
  FileText,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Droplets,
  Play,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardBody, Badge, Spinner } from '../../components/common';
import { formatDate, formatRelativeTime, getAge } from '../../utils';
import { RISK_CATEGORY_LABELS, CBC_PARAMETERS, HPLC_PARAMETERS, CHART_COLORS } from '../../constants';
import { patientAPI, predictionAPI } from '../../api/endpoints';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'tests', label: 'Test History', icon: FileText },
  { id: 'predictions', label: 'Predictions', icon: Activity },
];

export default function PatientDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [tests, setTests] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [runningPredictions, setRunningPredictions] = useState({});
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const data = await patientAPI.getById(id);
        // Map backend fields to UI-friendly fields
        setPatient({
          id: data.id,
          name: `${data.first_name} ${data.last_name}`.trim(),
          cnic: data.mrn || '',
          dateOfBirth: data.dob,
          gender: data.gender || 'male',
          bloodGroup: data.blood_group || 'N/A',
          phone: data.contact_number || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          emergencyContact: data.emergency_contact || '',
          emergencyContactName: data.emergency_contact_name || '',
          medicalHistory: data.medical_history || '',
          familyHistory: data.family_history || '',
          allergies: data.allergies || '',
          createdAt: data.created_at,
          lastVisit: data.updated_at || data.created_at,
        });
      } catch (err) {
        console.error('Failed to load patient:', err);
        setPatient(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  // Fetch tests and predictions for this patient
  useEffect(() => {
    if (!id) return;
    const fetchRelated = async () => {
      try {
        const [testsData, predsData] = await Promise.all([
          patientAPI.getTestHistory(id).catch(() => []),
          patientAPI.getPredictionHistory(id).catch(() => []),
        ]);
        setTests(Array.isArray(testsData) ? testsData : []);
        setPredictions(Array.isArray(predsData) ? predsData : []);
      } catch (err) {
        console.error('Failed to load tests/predictions:', err);
      }
    };
    fetchRelated();
  }, [id]);

  const handleRunPrediction = async (testId) => {
    setRunningPredictions(prev => ({ ...prev, [testId]: true }));
    try {
      const result = await predictionAPI.predict(testId);
      toast.success(`Prediction: ${result.final_diagnosis} (${result.confidence?.toFixed(1)}% confidence)`);
      const predsData = await patientAPI.getPredictionHistory(id).catch(() => []);
      setPredictions(Array.isArray(predsData) ? predsData : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to run prediction. Ensure test is VERIFIED.');
    } finally {
      setRunningPredictions(prev => ({ ...prev, [testId]: false }));
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const getRiskBadge = (risk, size = 'default') => {
    const variants = {
      carrier: 'carrier',
      minor: 'minor',
      major: 'major',
      severe: 'severe',
      not_detected: 'default',
    };
    return (
      <Badge variant={variants[risk] || 'default'} size={size}>
        {RISK_CATEGORY_LABELS[risk] || risk}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const config = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      VERIFIED: { color: 'bg-blue-100 text-blue-800', label: 'Verified' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    };
    const { color, label } = config[s] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={color}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
        <Link to="/doctor/patients" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/doctor/patients"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>{patient.cnic}</span>
                <span>•</span>
                <span>{getAge(patient.dateOfBirth)} years</span>
                <span>•</span>
                <Badge variant="default">{patient.bloodGroup}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/doctor/tests/new?patientId=${id}`)}
            className="btn-secondary"
          >
            <FileText className="w-4 h-4 mr-2" />
            New Test
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">CNIC</label>
                  <p className="font-medium text-gray-900">{patient.cnic}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date of Birth</label>
                  <p className="font-medium text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Gender</label>
                  <p className="font-medium text-gray-900 capitalize">{patient.gender}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Blood Group</label>
                  <p className="font-medium text-gray-900">{patient.bloodGroup}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-900">{patient.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Address</label>
                  <p className="font-medium text-gray-900">{patient.address}, {patient.city}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
                    <p className="text-sm text-gray-500">Total Tests</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
                    <p className="text-sm text-gray-500">Predictions</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Visit</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(patient.lastVisit)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Medical History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Medical History</label>
                  <p className="text-gray-900">{patient.medicalHistory || 'No records'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Family History of Thalassemia</label>
                  <p className="text-gray-900">{patient.familyHistory || 'No records'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Allergies</label>
                  <p className="text-gray-900">{patient.allergies || 'None reported'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tests Tab ── */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/doctor/tests/new?patientId=${id}`)}
              className="btn-primary"
            >
              <FileText className="w-4 h-4 mr-2" />
              New Test
            </button>
          </div>

          {tests.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-center text-gray-500 py-8">No tests found for this patient.</p>
              </CardBody>
            </Card>
          ) : (
            tests.map((test) => (
              <Card key={test.id}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Test #{test.id} — CBC + HPLC</p>
                        <p className="text-sm text-gray-500">{formatDate(test.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(test.status)}
                      {(test.status || '').toUpperCase() === 'VERIFIED' && (
                        <button
                          onClick={() => handleRunPrediction(test.id)}
                          disabled={runningPredictions[test.id]}
                          className="btn-primary btn-sm flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          {runningPredictions[test.id] ? 'Running...' : 'Run Prediction'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Key CBC values */}
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { key: 'hb', label: 'Hb' },
                      { key: 'rbc', label: 'RBC' },
                      { key: 'mcv', label: 'MCV' },
                      { key: 'mch', label: 'MCH' },
                      { key: 'rdw', label: 'RDW' },
                      { key: 'hba2', label: 'HbA2' },
                      { key: 'hbf', label: 'HbF' },
                    ].map(({ key, label }) => {
                      const val = test[key];
                      if (val == null) return null;
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="font-medium text-gray-900">{val}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Predictions Tab ── */}
      {activeTab === 'predictions' && (
        <div className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-center text-gray-500 py-8">No predictions yet. Run a prediction from the Tests tab on a VERIFIED test.</p>
              </CardBody>
            </Card>
          ) : (
            predictions.map((pred) => {
              const diagnosis = pred.final_diagnosis || pred.classification || 'Unknown';
              const conf = pred.confidence || (pred.risk_score ? Math.round(pred.risk_score * 100) : 0);
              const diagnosisToRisk = {
                'Alpha Trait': 'carrier', 'Silent Carrier': 'carrier',
                'Iron Deficiency': 'minor', 'Infection/Other': 'minor', 'Normal': 'not_detected',
              };
              const riskKey = diagnosisToRisk[diagnosis] || 'not_detected';

              return (
                <Card key={pred.id}>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            {getRiskBadge(riskKey)}
                            <span className="font-semibold text-gray-900">{diagnosis}</span>
                            <span className="text-sm text-gray-500">
                              {conf}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {formatDate(pred.created_at)} • Agreement: {pred.agreement_rate || 'N/A'} • {pred.clinical_status || ''}
                          </p>
                          {pred.dna_recommendation && (
                            <div className="flex items-center gap-2 mt-3 p-3 bg-yellow-50 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-yellow-800">
                                {pred.dna_recommendation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/doctor/predictions/${pred.id}`}
                        className="btn-secondary btn-sm"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
