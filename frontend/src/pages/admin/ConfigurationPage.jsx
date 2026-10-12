/**
 * ThalCare Admin Configuration Page
 */

import { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Globe,
    ShieldCheck,
    Bell,
    Database,
    Mail,
    RefreshCw
} from 'lucide-react';
import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Input,
    Select,
    Button,
    Spinner,
    Alert
} from '../../components/common';
import { adminAPI } from '../../api/endpoints';

export default function ConfigurationPage() {
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const data = await adminAPI.getConfig();
                setConfig(data);
            } catch (error) {
                console.error('Failed to fetch config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await adminAPI.updateConfig(config);
            setMessage({ type: 'success', text: 'System configuration updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update system configuration' });
        } finally {
            setIsSaving(false);
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
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-gray-500 mt-1">Manage global system settings and defaults</p>
            </div>

            {message.text && (
                <Alert variant={message.type === 'success' ? 'success' : 'error'}>
                    {message.text}
                </Alert>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                        </div>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Site Name"
                            value={config.site_name}
                            onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
                        />
                        <div className="flex items-center gap-3 pt-6">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.maintenance_mode}
                                    onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">Maintenance Mode</span>
                            </label>
                        </div>
                    </CardBody>
                </Card>

                {/* Prediction Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Prediction Engine</h2>
                        </div>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Model Version"
                            value={config.prediction_model_version}
                            readOnly
                            description="Current active ML model version"
                        />
                        <div className="flex items-end">
                            <button type="button" className="btn-secondary flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Retrain Model
                            </button>
                        </div>
                    </CardBody>
                </Card>

                {/* Email Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">SMTP Settings</h2>
                        </div>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="SMTP Server"
                            value={config.smtp_settings.server}
                            onChange={(e) => setConfig({
                                ...config,
                                smtp_settings: { ...config.smtp_settings, server: e.target.value }
                            })}
                        />
                        <Input
                            label="SMTP Port"
                            type="number"
                            value={config.smtp_settings.port}
                            onChange={(e) => setConfig({
                                ...config,
                                smtp_settings: { ...config.smtp_settings, port: parseInt(e.target.value) }
                            })}
                        />
                        <Input
                            label="Sender Email"
                            value={config.smtp_settings.user}
                            onChange={(e) => setConfig({
                                ...config,
                                smtp_settings: { ...config.smtp_settings, user: e.target.value }
                            })}
                        />
                    </CardBody>
                </Card>

                <div className="flex justify-end gap-3">
                    <button type="button" className="btn-secondary">Reset Defaults</button>
                    <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
                        Save Configuration
                    </Button>
                </div>
            </form>
        </div>
    );
}
