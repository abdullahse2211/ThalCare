/**
 * ThalCare Doctor Pending Tests Page
 * Shows only patients who haven't had a completed test yet
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Plus, Eye, Clock, User, Calendar, Phone, Download,
} from 'lucide-react';
import { Card, CardBody, Badge, Spinner, Input } from '../../components/common';
import { formatRelativeTime } from '../../utils';
import { patientAPI } from '../../api/endpoints';

function getAge(dob) {
    if (!dob) return '—';
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function PendingTestsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPendingPatients = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await patientAPI.getPendingTest();
                const transformed = (Array.isArray(data) ? data : []).map(p => ({
                    id: p.id,
                    name: `${p.first_name} ${p.last_name}`.trim(),
                    cnic: p.mrn || '',
                    age: getAge(p.dob),
                    gender: p.gender || 'male',
                    phone: p.contact_number || '',
                    city: p.city || '',
                    createdAt: p.created_at,
                }));
                setAllPatients(transformed);
            } catch (err) {
                console.error('Failed to fetch pending patients:', err);
                setError('Could not load pending patients. Make sure the backend is running.');
                setAllPatients([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPendingPatients();
    }, []);

    useEffect(() => {
        if (!search) {
            setPatients(allPatients);
        } else {
            const q = search.toLowerCase();
            setPatients(allPatients.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.cnic.includes(search) ||
                p.phone.includes(search)
            ));
        }
    }, [search, allPatients]);

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
                    <h1 className="text-2xl font-bold text-gray-900">Pending Tests</h1>
                    <p className="text-gray-500 mt-1">
                        Patients registered but not yet tested — {allPatients.length} awaiting
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (allPatients.length > 0) {
                                toast.success('Exporting pending tests list...');
                            } else {
                                toast.error('No pending tests to export');
                            }
                        }}
                        className="btn-secondary"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <Link to="/doctor/patients/new" className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Patient
                    </Link>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Search */}
            <Card>
                <CardBody>
                    <Input
                        placeholder="Search by name, CNIC, or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                    />
                </CardBody>
            </Card>

            {/* Count */}
            <div className="text-sm text-gray-500">
                Showing {patients.length} patient{patients.length !== 1 ? 's' : ''} awaiting tests
            </div>

            {/* Patient Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map(patient => (
                    <Card key={patient.id} className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
                        <CardBody>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                                        <p className="text-xs text-gray-500">{patient.cnic}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                </div>
                            </div>

                            <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{patient.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{patient.age} yrs • {patient.gender === 'male' ? 'Male' : 'Female'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Registered {formatRelativeTime(patient.createdAt)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Link
                                    to={`/doctor/patients/${patient.id}`}
                                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Patient
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {patients.length === 0 && !error && (
                <Card>
                    <CardBody className="text-center py-12">
                        <Clock className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {search ? 'No matching patients' : 'All patients have been tested!'}
                        </h3>
                        <p className="text-gray-500">
                            {search
                                ? 'Try adjusting your search'
                                : 'Every registered patient has at least one completed test.'}
                        </p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
