/**
 * ThalCare Lab Technician Test Entry Page
 * Fully wired to real backend API.
 * Collects all 15 lab features required by the ML Brain.
 * Biological limits enforced on all CBC + HPLC parameters.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Send, Droplets, TestTube, AlertCircle, User, CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Select, Spinner, Alert } from '../../components/common';
import { patientAPI, testAPI } from '../../api/endpoints';

// ── Biological limit validation ───────────────────────────────────────────────
// These are survivable extreme limits — values outside these ranges are
// physiologically impossible or incompatible with life.
const bioField = (bioMin, bioMax, label, unit) =>
  z.string()
    .min(1, `${label} is required`)
    .refine(
      (v) => !isNaN(parseFloat(v)),
      `${label} must be a number`
    )
    .refine(
      (v) => parseFloat(v) >= bioMin,
      `${label} cannot be below ${bioMin} ${unit} — this value is not physiologically possible`
    )
    .refine(
      (v) => parseFloat(v) <= bioMax,
      `${label} cannot exceed ${bioMax} ${unit} — this value is not physiologically possible`
    );

const testSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),

  // ── CBC Parameters ──────────────────────────────────────────────────────────
  hb:    bioField(3.0,   22.0,  'Hemoglobin (Hb)',    'g/dL'),
  rbc:   bioField(1.0,   9.0,   'RBC',                '×10⁶/µL'),
  pcv:   bioField(10.0,  70.0,  'PCV/Hematocrit',     '%'),
  mcv:   bioField(50.0,  150.0, 'MCV',                'fL'),
  mch:   bioField(10.0,  50.0,  'MCH',                'pg'),
  mchc:  bioField(20.0,  40.0,  'MCHC',               'g/dL'),
  rdw:   bioField(10.0,  35.0,  'RDW',                '%'),
  plt:   bioField(10.0,  1500.0,'Platelets',           '×10³/µL'),
  wbc:   bioField(0.5,   30.0,  'WBC',                '×10³/µL'),
  neut:  bioField(5.0,   95.0,  'Neutrophils',        '%'),
  lymph: bioField(5.0,   95.0,  'Lymphocytes',        '%'),

  // ── HPLC Parameters ─────────────────────────────────────────────────────────
  hba:   bioField(50.0,  100.0, 'HbA',                '%'),
  hba2:  bioField(0.0,   10.0,  'HbA2',               '%'),
  hbf:   bioField(0.0,   100.0, 'HbF',                '%'),

  notes: z.string().optional(),
});

// ── Field config ──────────────────────────────────────────────────────────────
// nMin/nMax = normal clinical reference range (for colour coding)
// bioMin/bioMax = absolute biological limits (for Zod validation)
const CBC_FIELDS = [
  { key: 'hb',    label: 'Hemoglobin (Hb)',  unit: 'g/dL',        nMin: 12,   nMax: 17,   bioMin: 3.0,   bioMax: 22.0   },
  { key: 'rbc',   label: 'RBC',              unit: '×10⁶/µL',     nMin: 4.5,  nMax: 5.5,  bioMin: 1.0,   bioMax: 9.0    },
  { key: 'pcv',   label: 'PCV / Hematocrit', unit: '%',           nMin: 36,   nMax: 50,   bioMin: 10.0,  bioMax: 70.0   },
  { key: 'mcv',   label: 'MCV',              unit: 'fL',          nMin: 80,   nMax: 100,  bioMin: 50.0,  bioMax: 150.0  },
  { key: 'mch',   label: 'MCH',              unit: 'pg',          nMin: 27,   nMax: 33,   bioMin: 10.0,  bioMax: 50.0   },
  { key: 'mchc',  label: 'MCHC',             unit: 'g/dL',        nMin: 32,   nMax: 36,   bioMin: 20.0,  bioMax: 40.0   },
  { key: 'rdw',   label: 'RDW',              unit: '%',           nMin: 11.5, nMax: 14.5, bioMin: 10.0,  bioMax: 35.0   },
  { key: 'plt',   label: 'Platelets',        unit: '×10³/µL',     nMin: 150,  nMax: 400,  bioMin: 10.0,  bioMax: 1500.0 },
  { key: 'wbc',   label: 'WBC',              unit: '×10³/µL',     nMin: 4.5,  nMax: 11,   bioMin: 0.5,   bioMax: 30.0   },
  { key: 'neut',  label: 'Neutrophils',      unit: '%',           nMin: 40,   nMax: 70,   bioMin: 5.0,   bioMax: 95.0   },
  { key: 'lymph', label: 'Lymphocytes',      unit: '%',           nMin: 20,   nMax: 40,   bioMin: 5.0,   bioMax: 95.0   },
];

const HPLC_FIELDS = [
  { key: 'hba',  label: 'HbA (Adult)',  unit: '%', nMin: 95,  nMax: 98,  bioMin: 50.0,  bioMax: 100.0 },
  { key: 'hba2', label: 'HbA2',         unit: '%', nMin: 2.0, nMax: 3.5, bioMin: 0.0,   bioMax: 10.0  },
  { key: 'hbf',  label: 'HbF (Fetal)', unit: '%', nMin: 0,   nMax: 2,   bioMin: 0.0,   bioMax: 100.0 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function TestEntryPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('save');

  const patientIdFromUrl = searchParams.get('patientId');
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      patientId: patientIdFromUrl || '',
      hb: '', rbc: '', pcv: '', mcv: '', mch: '', mchc: '',
      rdw: '', plt: '', wbc: '', neut: '', lymph: '',
      hba: '', hba2: '', hbf: '',
      notes: '',
    },
  });

  // ── Fetch patients ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientAPI.getAll({ limit: 500 });
        setPatients(data || []);
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const toFloat = (v) => (v === '' || v === null || v === undefined) ? null : parseFloat(v);
      const patientId = parseInt(data.patientId);

      const testPayload = {
        patient_id: patientId,
        hb:    toFloat(data.hb),
        rbc:   toFloat(data.rbc),
        pcv:   toFloat(data.pcv),
        mcv:   toFloat(data.mcv),
        mch:   toFloat(data.mch),
        mchc:  toFloat(data.mchc),
        rdw:   toFloat(data.rdw),
        plt:   toFloat(data.plt),
        wbc:   toFloat(data.wbc),
        neut:  toFloat(data.neut),
        lymph: toFloat(data.lymph),
        hba:   toFloat(data.hba),
        hba2:  toFloat(data.hba2),
        hbf:   toFloat(data.hbf),
        status: 'PENDING',
      };

      let savedTest;
      if (isEditMode) {
        savedTest = await testAPI.update(id, testPayload);
      } else {
        savedTest = await testAPI.create(testPayload);
      }

      if (submitAction === 'submit') {
        await testAPI.verify(savedTest.id);
        toast.success('Test submitted and verified — doctor can now run prediction!');
      } else {
        toast.success('Test saved as draft.');
      }

      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/doctor')) {
        navigate(`/doctor/patients/${patientId}?tab=tests`);
      } else {
        navigate(`/lab/patients/${patientId}?tab=tests`);
      }
    } catch (error) {
      console.error('Test save error:', error);
      toast.error(error?.message || 'Failed to save test data. Check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Colour coding ────────────────────────────────────────────────────────────
  const getStatus = (value, nMin, nMax) => {
    if (!value || value === '') return null;
    const n = parseFloat(value);
    if (isNaN(n)) return null;
    if (n < nMin) return 'low';
    if (n > nMax) return 'high';
    return 'normal';
  };

  const statusBorderClass = (s) => ({
    low:    'border-blue-500 bg-blue-50',
    high:   'border-red-500 bg-red-50',
    normal: 'border-green-500 bg-green-50',
  }[s] || '');

  const statusLabel = (s) => ({
    low: '↓ Below normal', high: '↑ Above normal', normal: '✓ Normal',
  }[s] || '');

  const statusTextClass = (s) => ({
    low: 'text-blue-600', high: 'text-red-600', normal: 'text-green-600',
  }[s] || '');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/lab/tests" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Test Data' : 'Enter Test Data'}
          </h1>
          <p className="text-gray-500 mt-1">
            Enter CBC and HPLC values — all 15 fields feed into the ML models
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Patient</h2>
            </div>
          </CardHeader>
          <CardBody>
            {loadingPatients ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Spinner size="sm" /> Loading patients...
              </div>
            ) : (
              <Select
                label="Select Patient"
                error={errors.patientId?.message}
                {...register('patientId')}
                options={[
                  { value: '', label: 'Select a patient...' },
                  ...patients.map(p => ({
                    value: String(p.id),
                    label: `${p.first_name} ${p.last_name} (${p.mrn})`,
                  })),
                ]}
              />
            )}
          </CardBody>
        </Card>

        {/* CBC Parameters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">CBC Parameters</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Complete Blood Count — 11 values</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CBC_FIELDS.map(({ key, label, unit, nMin, nMax, bioMin, bioMax }) => {
                const val = watch(key);
                const st = getStatus(val, nMin, nMax);
                return (
                  <div key={key}>
                    <Input
                      label={label}
                      type="number"
                      step="0.01"
                      min={bioMin}
                      max={bioMax}
                      placeholder={`${nMin}–${nMax}`}
                      error={errors[key]?.message}
                      className={st && !errors[key] ? statusBorderClass(st) : ''}
                      helperText={`${unit} | Limit: ${bioMin}–${bioMax}`}
                      {...register(key)}
                    />
                    {st && !errors[key] && (
                      <span className={`text-xs ${statusTextClass(st)}`}>
                        {statusLabel(st)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* HPLC Parameters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">HPLC Parameters</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Hemoglobin Electrophoresis — 3 values in %</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {HPLC_FIELDS.map(({ key, label, unit, nMin, nMax, bioMin, bioMax }) => {
                const val = watch(key);
                const st = getStatus(val, nMin, nMax);
                return (
                  <div key={key}>
                    <Input
                      label={label}
                      type="number"
                      step="0.01"
                      min={bioMin}
                      max={bioMax}
                      placeholder={`${nMin}–${nMax}%`}
                      error={errors[key]?.message}
                      className={st && !errors[key] ? statusBorderClass(st) : ''}
                      helperText={`Normal: ${nMin}–${nMax}% | Limit: ${bioMin}–${bioMax}%`}
                      {...register(key)}
                    />
                    {st && !errors[key] && (
                      <span className={`text-xs ${statusTextClass(st)}`}>
                        {statusLabel(st)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>Auto-calculated by system:</strong> Mentzer Index (MCV÷RBC) and Srivastava
              Index (MCH÷RBC) are derived automatically — you do not need to enter them.
            </div>
          </CardBody>
        </Card>

        {/* Biological Limits Reference */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Biological Limits Reference</h2>
            <p className="text-sm text-gray-500 mt-1">
              Values outside these ranges will be rejected — they are not physiologically possible
            </p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Parameter</th>
                    <th className="pb-2 pr-4">Minimum</th>
                    <th className="pb-2 pr-4">Maximum</th>
                    <th className="pb-2">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...CBC_FIELDS, ...HPLC_FIELDS].map(({ label, bioMin, bioMax, unit }) => (
                    <tr key={label} className="text-gray-700">
                      <td className="py-1.5 pr-4 font-medium">{label}</td>
                      <td className="py-1.5 pr-4 text-blue-600">{bioMin}</td>
                      <td className="py-1.5 pr-4 text-red-600">{bioMax}</td>
                      <td className="py-1.5 text-gray-400">{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
          </CardHeader>
          <CardBody>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Any additional observations..."
              {...register('notes')}
            />
          </CardBody>
        </Card>

        {/* Info Alert */}
        <Alert variant="info">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Important</p>
              <p className="text-sm mt-1">
                "Submit for Verification" will mark this test as VERIFIED and ready for ML
                prediction. The doctor will be able to run the 5-model ensemble from their dashboard.
              </p>
            </div>
          </div>
        </Alert>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/lab/tests" className="btn-secondary">Cancel</Link>

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('save')}
            className="btn-secondary"
          >
            {isSubmitting && submitAction === 'save' ? (
              <><Spinner size="sm" className="mr-2" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Draft</>
            )}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('submit')}
            className="btn-primary"
          >
            {isSubmitting && submitAction === 'submit' ? (
              <><Spinner size="sm" className="mr-2" />Submitting...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Submit for Verification</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
