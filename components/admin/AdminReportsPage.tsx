
import React, { useState, useEffect } from 'react';
import * as api from '../../api';

interface Report {
    id: string;
    targetId: string;
    targetType: 'post' | 'user' | 'tribe' | 'comment' | 'story';
    reason: string;
    description?: string;
    reporter: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
    status: 'pending' | 'resolved' | 'dismissed';
    timestamp: string;
}

interface AdminReportsPageProps {
    onBack: () => void;
}

const AdminReportsPage: React.FC<AdminReportsPageProps> = ({ onBack }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.fetchReports();
            setReports(data || []); // Assuming API returns array directly or inside data
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            // Mock data for demonstration if API fails
            setReports([
                {
                    id: 'r1',
                    targetId: 'p1',
                    targetType: 'post',
                    reason: 'spam',
                    description: 'This post is just an ad.',
                    reporter: { id: 'u2', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=jane' },
                    status: 'pending',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'r2',
                    targetId: 'u3',
                    targetType: 'user',
                    reason: 'harassment',
                    description: 'User is sending mean messages.',
                    reporter: { id: 'u1', name: 'John Smith', avatarUrl: 'https://i.pravatar.cc/150?u=john' },
                    status: 'pending',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (reportId: string, action: 'dismiss' | 'ban' | 'delete_content') => {
        try {
            await api.resolveReport(reportId, action);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            console.error('Failed to resolve report:', err);
            alert('Failed to perform action. (Backend might be missing)');
            // Optimistic update for demo
            setReports(prev => prev.filter(r => r.id !== reportId));
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-surface transition-colors">
                    <BackIcon />
                </button>
                <h1 className="text-2xl font-bold text-primary font-display">Moderation Dashboard</h1>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-surface p-8 text-center rounded-2xl border border-border">
                    <p className="text-secondary text-lg">No pending reports! 🎉</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${report.targetType === 'user' ? 'bg-blue-100 text-blue-700' :
                                            report.targetType === 'post' ? 'bg-green-100 text-green-700' :
                                                report.targetType === 'tribe' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {report.targetType}
                                    </span>
                                    <span className="text-secondary text-xs">{new Date(report.timestamp).toLocaleDateString()}</span>
                                </div>
                                <span className="text-sm font-semibold text-red-500">{report.reason}</span>
                            </div>

                            <div className="mb-4">
                                <p className="text-primary font-medium">Target ID: {report.targetId}</p>
                                {report.description && <p className="text-secondary text-sm mt-1">"{report.description}"</p>}
                                <p className="text-xs text-secondary mt-2">Reported by: {report.reporter.name}</p>
                            </div>

                            <div className="flex space-x-2 justify-end pt-3 border-t border-border">
                                <button
                                    onClick={() => handleAction(report.id, 'dismiss')}
                                    className="px-3 py-1.5 text-sm font-medium text-secondary hover:bg-background rounded-lg transition-colors"
                                >
                                    Dismiss
                                </button>
                                {report.targetType !== 'user' && (
                                    <button
                                        onClick={() => handleAction(report.id, 'delete_content')}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                    >
                                        Delete Content
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction(report.id, 'ban')}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Ban User
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;

export default AdminReportsPage;
