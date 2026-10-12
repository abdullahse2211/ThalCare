/**
 * ThalCare Admin Audit Logs Page
 */

import { useState, useEffect } from 'react';
import {
    ClipboardList,
    Search,
    Calendar,
    Filter,
    Download,
    Terminal
} from 'lucide-react';
import {
    Card,
    CardBody,
    Input,
    Select,
    Badge,
    Spinner
} from '../../components/common';
import { adminAPI } from '../../api/endpoints';
import { formatDate } from '../../utils';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const data = await adminAPI.getAuditLogs({ search, type: typeFilter });
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch logs:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [search, typeFilter]);

    const getActionBadge = (action) => {
        const actions = {
            'LOGIN': 'bg-blue-100 text-blue-700',
            'CREATE_USER': 'bg-green-100 text-green-700',
            'DELETE_USER': 'bg-red-100 text-red-700',
            'UPDATE_CONFIG': 'bg-purple-100 text-purple-700',
            'EXPORT_REPORT': 'bg-orange-100 text-orange-700'
        };
        return actions[action] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-500 mt-1">Track system activity and administrative actions</p>
            </div>

            <Card>
                <CardBody className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Actions' },
                                { value: 'LOGIN', label: 'Login' },
                                { value: 'CREATE_USER', label: 'User Creation' },
                                { value: 'DELETE', label: 'Deletions' },
                            ]}
                        />
                    </div>
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </CardBody>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <Spinner />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No logs found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(log.timestamp, 'MMM dd, HH:mm:ss')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{log.user}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge className={getActionBadge(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
