import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from '../../components/common/Toast';
import * as api from '../../api';
import { Report } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'post' | 'user' | 'tribe';

const AdminReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('post');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.fetchReports({ targetType: tab, limit: 100, status: 'open' });
      setReports(data.reports || []);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const canModerateTarget = (report: any) => {
    if (tab !== 'user') return true;
    const targetUser = report.reportedUser;
    if (!targetUser) return true;
    if ((targetUser.isAdmin || targetUser.isSuperAdmin) && !currentUser?.isSuperAdmin) return false;
    return true;
  };

  const act = async (report: any, actionType: string) => {
    const targetId = report.targetId || report.reportedPost?._id || report.reportedUser?._id || report.reportedTribe?._id;
    try {
      if (actionType === 'dismiss') {
        await api.updateReportStatus(report.id, 'dismissed');
      } else {
        await api.applyModerationAction({ targetType: tab, targetId, actionType, reason: report.reason });
      }
      setReports(prev => prev.filter(r => r.id !== report.id));
      toast.success('Action applied.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to apply action.');
    }
  };

  const tabs: Tab[] = ['post', 'user', 'tribe'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-primary">Reports</h1>
        <p className="text-sm text-secondary mt-1">Newest first. Review and action posts, users, and tribes.</p>
        <div className="mt-4 flex gap-2">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-accent text-accent-text' : 'bg-background text-secondary'}`}>
              {item === 'post' ? 'Posts' : item === 'user' ? 'Users' : 'Tribes'}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-secondary">Loading reports...</p>}
          {!loading && reports.length === 0 && <p className="text-sm text-secondary">No open reports.</p>}
          {reports.map((report: any) => {
            const target = report.reportedPost || report.reportedUser || report.reportedTribe;
            const locked = !canModerateTarget(report);
            return (
              <div key={report.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between text-xs text-secondary">
                  <span>@{report.reporterId?.username} · {new Date(report.createdAt).toLocaleString()}</span>
                  <span className="uppercase">{report.status}</span>
                </div>
                <p className="mt-2 text-sm text-primary">Reason: {report.reason}</p>
                {report.details && <p className="text-xs text-secondary mt-1">{report.details}</p>}
                <p className="text-xs text-secondary mt-2">Target: {target?.name || target?.username || target?.content || 'Unknown'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tab !== 'user' && <button onClick={() => act(report, target?.isHidden ? 'unhide' : 'hide')} className="rounded-lg bg-background px-3 py-1 text-xs text-primary border border-border">{target?.isHidden ? 'Unhide' : 'Hide'}</button>}
                  {tab === 'user' && <button disabled={locked} onClick={() => act(report, target?.isDisabled ? 'unhide' : 'hide')} className="rounded-lg bg-background px-3 py-1 text-xs text-primary border border-border disabled:opacity-50">{target?.isDisabled ? 'Enable user' : 'Disable user'}</button>}
                  <button disabled={locked} onClick={() => act(report, 'delete')} className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 disabled:opacity-50">Delete</button>
                  <button onClick={() => act(report, 'dismiss')} className="rounded-lg bg-background px-3 py-1 text-xs text-secondary border border-border">Dismiss</button>
                  <button onClick={() => act(report, 'dismiss')} className="rounded-lg bg-accent/20 px-3 py-1 text-xs text-accent">Mark resolved</button>
                </div>
                {locked && <p className="mt-2 text-xs text-red-300">Only super admin can moderate admin accounts.</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
