/**
 * ThalCare Lab Technician Upload Page
 * Upload CBC/HPLC report files
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Select, Alert, Spinner } from '../../components/common';
import { formatFileSize } from '../../utils';
import { FILE_UPLOAD_CONFIG } from '../../constants';
import { useDropzone } from 'react-dropzone';
import { patientAPI } from '../../api/endpoints';

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientAPI.getAll({ limit: 1000 });
        setPatients(data || []);
      } catch (error) {
        toast.error('Failed to load patients list');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      const errors = file.errors.map(e => e.message).join(', ');
      toast.error(`${file.file.name}: ${errors}`);
    });

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: FILE_UPLOAD_CONFIG.maxSize,
    maxFiles: 10,
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (files.length === 0) {
      toast.error('Please add files to upload');
      return;
    }

    setUploading(true);

    // Simulate upload for each file
    for (const file of files) {
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ));

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(prev => ({ ...prev, [file.id]: progress }));
      }

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'success' } : f
      ));
    }

    setUploading(false);
    toast.success('All files uploaded successfully!');

    // Navigate after short delay
    setTimeout(() => {
      navigate('/lab/tests');
    }, 1500);
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'uploading':
        return <Loader className="w-5 h-5 text-primary-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/lab"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Reports</h1>
          <p className="text-gray-500 mt-1">
            Upload CBC/HPLC report files for processing
          </p>
        </div>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Select Patient</h2>
        </CardHeader>
        <CardBody>
          {loadingPatients ? (
            <div className="flex items-center gap-3 py-2 text-gray-500">
              <Spinner size="sm" />
              <span>Loading patients...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search registered patients by name or MRN..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const filtered = patients.filter(p => 
                      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
                      (p.mrn || '').toLowerCase().includes(term)
                    );
                    setFilteredPatients(filtered.slice(0, 50));
                  }}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <Select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                options={[
                  { value: '', label: 'Select a patient...' },
                  ...(filteredPatients.length > 0 ? filteredPatients : patients.slice(0, 20)).map(p => ({
                    value: p.id,
                    label: `${p.first_name} ${p.last_name} (${p.mrn})`,
                  })),
                ]}
              />
              {filteredPatients.length === 0 && patients.length > 0 && (
                <p className="text-xs text-gray-500 italic">Showing default patients. Use the search bar above to find more.</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Upload Files</h2>
        </CardHeader>
        <CardBody>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'
              }`} />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary-600">Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: CSV, PDF, XLSX, XLS (Max {formatFileSize(FILE_UPLOAD_CONFIG.maxSize)} each)
                </p>
              </>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Selected Files ({files.length})
              </h3>
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${file.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : file.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all"
                          style={{ width: `${uploadProgress[file.id] || 0}%` }}
                        />
                      </div>
                    )}
                    {getStatusIcon(file.status)}
                    {file.status === 'pending' && !uploading && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Info */}
      <Alert variant="info">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Supported File Formats</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>• <strong>CSV:</strong> Comma-separated values from lab equipment</li>
              <li>• <strong>PDF:</strong> Scanned or digital lab reports</li>
              <li>• <strong>Excel:</strong> XLSX/XLS spreadsheet reports</li>
            </ul>
          </div>
        </div>
      </Alert>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Link to="/lab" className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0 || !selectedPatient}
          className="btn-primary"
        >
          {uploading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
