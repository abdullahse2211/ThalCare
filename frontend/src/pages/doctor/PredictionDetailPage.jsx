/**
 * ThalCare Doctor Prediction Detail Page
 * Detailed view of a single prediction with all analysis
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Activity,
  User,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Dna,
  Brain,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardBody, Badge, Spinner, Textarea } from '../../components/common';
import { formatDate, formatDateTime } from '../../utils';
import { RISK_CATEGORY_LABELS, CHART_COLORS } from '../../constants';
import { predictionAPI, testAPI } from '../../api/endpoints';

// Map diagnosis to risk badge category
const diagnosisToRisk = {
  'Alpha Trait': 'carrier', 'Silent Carrier': 'carrier',
  'Iron Deficiency': 'minor', 'Infection/Other': 'minor', 'Normal': 'not_detected',
};

export default function PredictionDetailPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [testData, setTestData] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      setIsLoading(true);
      try {
        const data = await predictionAPI.getById(id);
        setPrediction(data);
        setDoctorNotes(data.doctor_notes || '');

        // Also fetch the test data for CBC/HPLC values
        if (data.test_id) {
          try {
            const test = await testAPI.getById(data.test_id);
            setTestData(test);
          } catch (e) {
            console.warn('Could not load test data', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch prediction:', error);
        toast.error('Failed to load prediction details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [id]);

  const handleDownloadReport = async () => {
    try {
      await predictionAPI.downloadReport(id);
      toast.success('Report download started');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await predictionAPI.finalize(id, { doctor_analysis: doctorNotes });
      toast.success('Notes saved and prediction finalized');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Prediction not found</h2>
        <Link to="/doctor/predictions" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to predictions
        </Link>
      </div>
    );
  }

  // Derived values from real prediction data
  const riskKey = diagnosisToRisk[prediction.final_diagnosis] || 'not_detected';
  const confidenceValue = prediction.confidence?.toFixed(1) || (prediction.risk_score ? (prediction.risk_score * 100).toFixed(1) : '0');

  // Prepare ensemble probabilities chart data
  const probabilityData = prediction.ensemble_probabilities
    ? Object.entries(prediction.ensemble_probabilities).map(([name, value]) => ({
        risk: name,
        probability: value,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/doctor/predictions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prediction Analysis</h1>
            <p className="text-gray-500 mt-1">
              ID: #{prediction.id} • {formatDateTime(prediction.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
          <button
            onClick={handleDownloadReport}
            className="btn-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prediction Summary */}
        <div className="space-y-6">
          {/* Prediction Result */}
          <Card className="border-2 border-primary-200 bg-primary-50">
            <CardBody className="text-center py-8">
              <Brain className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ML Prediction Result</h3>
              <div className="mb-2">{getRiskBadge(riskKey, 'lg')}</div>
              <p className="text-xl font-bold text-gray-800 mb-2">
                {prediction.final_diagnosis || prediction.classification || 'Unknown'}
              </p>
              <p className="text-3xl font-bold text-primary-600 mb-1">
                {confidenceValue}%
              </p>
              <p className="text-sm text-gray-500">Confidence Score</p>
              <p className="text-xs text-gray-400 mt-1">Agreement: {prediction.agreement_rate || 'N/A'}</p>
              <p className="text-xs text-gray-400 mt-1">Model v{prediction.model_version || '2.0'}</p>

              {/* Clinical Disclaimer */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Clinical Note:</strong> Infection/Other and Iron Deficiency share overlapping 
                  hematological profiles. If prediction confidence is below 80%, additional clinical 
                  workup is recommended before final diagnosis.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* DNA Recommendation */}
          {prediction.dna_recommendation && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Dna className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-800">DNA Recommendation</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      {prediction.dna_recommendation}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Derived Indices */}
          {prediction.derived_indices && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Derived Indices</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Mentzer Index</p>
                    <p className="text-lg font-bold">{prediction.derived_indices.Mentzer_Index}</p>
                    <p className="text-xs text-gray-400">{'<'}13 = Thalassemia, {'>'}13 = Iron Def.</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Srivastava Index</p>
                    <p className="text-lg font-bold">{prediction.derived_indices.Srivastava_Index}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Ensemble Probabilities Chart */}
          {probabilityData.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Ensemble Probabilities</h3>
              </CardHeader>
              <CardBody>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={probabilityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="risk" width={90} fontSize={11} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="probability" fill={CHART_COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column - Test Values & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* CBC Values from test data */}
          {testData && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">CBC Parameters</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    { key: 'hb', label: 'Hb', unit: 'g/dL', nMin: 12, nMax: 17 },
                    { key: 'rbc', label: 'RBC', unit: 'M/uL', nMin: 4.5, nMax: 5.5 },
                    { key: 'pcv', label: 'PCV', unit: '%', nMin: 36, nMax: 50 },
                    { key: 'mcv', label: 'MCV', unit: 'fL', nMin: 80, nMax: 100 },
                    { key: 'mch', label: 'MCH', unit: 'pg', nMin: 27, nMax: 33 },
                    { key: 'mchc', label: 'MCHC', unit: 'g/dL', nMin: 32, nMax: 36 },
                    { key: 'rdw', label: 'RDW', unit: '%', nMin: 11.5, nMax: 14.5 },
                    { key: 'plt', label: 'PLT', unit: 'k/uL', nMin: 150, nMax: 400 },
                    { key: 'wbc', label: 'WBC', unit: 'k/uL', nMin: 4.5, nMax: 11 },
                    { key: 'neut', label: 'Neut', unit: '%', nMin: 40, nMax: 70 },
                    { key: 'lymph', label: 'Lymph', unit: '%', nMin: 20, nMax: 40 },
                  ].map(({ key, label, unit, nMin, nMax }) => {
                    const val = testData[key];
                    if (val == null) return null;
                    const st = val < nMin ? 'low' : val > nMax ? 'high' : 'normal';
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-900">{val}</p>
                        <p className="text-xs text-gray-400">{nMin}-{nMax} {unit}</p>
                        <span className={`text-xs ${st==='low'?'text-blue-600':st==='high'?'text-red-600':'text-green-600'}`}>
                          {st==='low'?'Low':st==='high'?'High':'Normal'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* HPLC Values from test data */}
          {testData && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">HPLC Parameters</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {[
                    { key: 'hba', label: 'HbA', nMin: 95, nMax: 98 },
                    { key: 'hba2', label: 'HbA2', nMin: 2.0, nMax: 3.5 },
                    { key: 'hbf', label: 'HbF', nMin: 0, nMax: 2 },
                  ].map(({ key, label, nMin, nMax }) => {
                    const val = testData[key];
                    if (val == null) return null;
                    const st = val < nMin ? 'low' : val > nMax ? 'high' : 'normal';
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-900">{val}%</p>
                        <p className="text-xs text-gray-400">{nMin}-{nMax}%</p>
                        <span className={`text-xs ${st==='low'?'text-blue-600':st==='high'?'text-red-600':'text-green-600'}`}>
                          {st==='low'?'Low':st==='high'?'High':'Normal'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Per-Model Breakdown */}
          {prediction.model_predictions && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Per-Model Breakdown</h3>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-500 mb-4">
                  Individual model predictions from the 5-model ensemble
                </p>
                <div className="space-y-3">
                  {Object.entries(prediction.model_predictions).map(([modelName, diagnosis]) => {
                    const modelProbs = prediction.probabilities?.[modelName];
                    const conf = modelProbs?.[diagnosis];
                    return (
                      <div key={modelName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 w-48">{modelName}</span>
                        <span className="text-sm font-semibold text-gray-900">{diagnosis}</span>
                        <span className={`text-sm font-bold ${conf >= 90 ? 'text-green-600' : conf >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {conf?.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Doctor's Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Clinical Notes</h3>
              </div>
            </CardHeader>
            <CardBody>
              <Textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={4}
                placeholder="Add clinical notes..."
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Status: {prediction.is_finalized ? 'Finalized' : 'Pending Review'}
                  {prediction.clinical_status ? ` • ${prediction.clinical_status}` : ''}
                </p>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="btn-primary btn-sm"
                >
                  {isSaving ? 'Saving...' : 'Save & Finalize'}
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
