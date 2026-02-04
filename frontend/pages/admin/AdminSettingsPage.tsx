import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShieldCheck, MoreVertical, EyeOff, Trash2, Eye, AlertTriangle, X } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import * as api from '../../api';
import { Report, User } from '../../types';

interface AdminSettingsPageProps {
  currentUser: User | null;
}

type ActionType = 'hide' | 'delete' | 'dismiss' | 'warn' | 'unhide';

const timeAgo = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'reported' | 'hidden' | 'manage'>('reported');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Admin Settings</h1>
            <p className="text-sm text-secondary mt-1">Moderation dashboard for Tribe Social.</p>
          </div>
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold">Signed in as {currentUser?.username}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AdminTabButton active={activeTab === 'reported'} onClick={() => setActiveTab('reported')}>
            Reported Posts
          </AdminTabButton>
          <AdminTabButton active={activeTab === 'hidden'} onClick={() => setActiveTab('hidden')}>
            Hidden Posts
          </AdminTabButton>
          <AdminTabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')}>
            Content Management
          </AdminTabButton>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {activeTab === 'reported' && <ReportedPostsPanel />}
        {activeTab === 'hidden' && <HiddenPostsPanel />}
        {activeTab === 'manage' && <ManagePostsPanel />}
      </div>
    </div>
  );
};

const AdminTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-accent text-accent-text' : 'bg-background text-primary hover:bg-border'
    }`}
  >
    {children}
  </button>
);

const ReportedPostsPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; reasons: string[]; reportIds: string[] } | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchReports({ targetType: 'post', status: 'open', limit: 200 });
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, { post: any; reports: Report[] }>();
    reports.forEach((report) => {
      const target = report.targetId as any;
      const targetId = target?.id || target?._id || report.targetId;
      const existing = groups.get(targetId);
      if (existing) {
        existing.reports.push(report);
      } else {
        groups.set(targetId, { post: target, reports: [report] });
      }
    });
    return Array.from(groups.values());
  }, [reports]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary">Reported Posts</h2>
      {isLoading && <p className="text-sm text-secondary">Loading reports...</p>}
      {!isLoading && groupedReports.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No open reports yet.
        </div>
      )}

      {groupedReports.map(({ post, reports: postReports }) => {
        const totalReports = postReports.length;
        const reasonCounts = postReports.reduce<Record<string, number>>((acc, report) => {
          acc[report.reason] = (acc[report.reason] || 0) + 1;
          return acc;
        }, {});
        const reasons = Object.keys(reasonCounts);
        return (
          <div key={post?.id || post?._id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-secondary">Post by @{post?.user?.username || 'Unknown'} · {timeAgo(post?.createdAt)}</p>
                <p className="mt-2 text-primary">{post?.content || 'Media-only post'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <span key={reason} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      {reason} · {reasonCounts[reason]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">{totalReports} reports</p>
                <button
                  onClick={() =>
                    setActionTarget({
                      targetId: post?.id || post?._id,
                      reasons,
                      reportIds: postReports.map((report) => report.id),
                    })
                  }
                  className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90"
                >
                  Take Action
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-semibold text-primary mb-2">Reporters</p>
              <ul className="space-y-2 text-sm text-secondary">
                {postReports.map((report) => (
                  <li key={report.id} className="flex items-center justify-between">
                    <span>@{report.reporterId?.username} · {report.reason}</span>
                    <span>{timeAgo(report.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {actionTarget && (
        <ModerationActionModal
          actionTypeOptions={['hide', 'delete', 'dismiss', 'warn']}
          targetType="post"
          targetId={actionTarget.targetId}
          reasons={actionTarget.reasons}
          onClose={() => setActionTarget(null)}
          onSuccess={() => {
            setActionTarget(null);
            loadReports();
          }}
        />
      )}
    </div>
  );
};

const HiddenPostsPanel: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; action: ActionType } | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchModerationPosts({ status: 'hidden', limit: 50 });
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load hidden posts:', error);
      toast.error('Failed to load hidden posts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary">Hidden Posts</h2>
      {isLoading && <p className="text-sm text-secondary">Loading hidden posts...</p>}
      {!isLoading && posts.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No hidden posts right now.
        </div>
      )}
      {posts.map((post) => (
        <PostAdminCard
          key={post._id}
          post={post}
          subtitle={`Hidden ${timeAgo(post.hiddenAt)}`}
          onAction={(action) => setActionTarget({ targetId: post._id, action })}
          onViewReports={() => setReportsModalTarget(post._id)}
          actions={[
            { key: 'unhide', label: 'Unhide', icon: <Eye size={16} />, action: 'unhide' },
            { key: 'delete', label: 'Delete', icon: <Trash2 size={16} />, action: 'delete' },
          ]}
        />
      ))}

      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} onClose={() => setReportsModalTarget(null)} />
      )}
      {actionTarget && (
        <ModerationActionModal
          actionTypeOptions={[actionTarget.action]}
          targetType="post"
          targetId={actionTarget.targetId}
          reasons={['Policy violation', 'Multiple reports', 'Other']}
          onClose={() => setActionTarget(null)}
          onSuccess={() => {
            setActionTarget(null);
            loadPosts();
          }}
        />
      )}
    </div>
  );
};

const ManagePostsPanel: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ username: '', keyword: '', tags: '' });
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; action: ActionType } | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = useCallback(
    async (pageToLoad: number, replace = false) => {
      setIsLoading(true);
      try {
        const { data } = await api.fetchModerationPosts({
          page: pageToLoad,
          limit: 20,
          username: filters.username || undefined,
          keyword: filters.keyword || undefined,
          tags: filters.tags || undefined,
        });
        const newPosts = data.posts || [];
        setPosts((prev) => (replace ? newPosts : [...prev, ...newPosts]));
        setHasMore(pageToLoad < data.pages);
      } catch (error) {
        console.error('Failed to load posts:', error);
        toast.error('Failed to load posts.');
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setPage(1);
    loadPosts(1, true);
  }, [filters, loadPosts]);

  useEffect(() => {
    if (!loaderRef.current || isLoading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadPosts, page]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-primary">Content Management</h2>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <InputField
            label="Username"
            value={filters.username}
            onChange={(value) => setFilters((prev) => ({ ...prev, username: value }))}
            placeholder="Search by username"
          />
          <InputField
            label="Keyword"
            value={filters.keyword}
            onChange={(value) => setFilters((prev) => ({ ...prev, keyword: value }))}
            placeholder="Search by content"
          />
          <InputField
            label="Tags"
            value={filters.tags}
            onChange={(value) => setFilters((prev) => ({ ...prev, tags: value }))}
            placeholder="tag1, tag2"
          />
        </div>
      </div>

      {posts.map((post) => (
        <PostAdminCard
          key={post._id}
          post={post}
          subtitle={`Posted ${timeAgo(post.createdAt)}`}
          onAction={(action) => setActionTarget({ targetId: post._id, action })}
          onViewReports={() => setReportsModalTarget(post._id)}
          actions={[
            { key: 'hide', label: 'Hide', icon: <EyeOff size={16} />, action: 'hide' },
            { key: 'delete', label: 'Delete', icon: <Trash2 size={16} />, action: 'delete' },
          ]}
        />
      ))}

      <div ref={loaderRef} className="h-8" />
      {isLoading && <p className="text-sm text-secondary">Loading more posts...</p>}

      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} onClose={() => setReportsModalTarget(null)} />
      )}
      {actionTarget && (
        <ModerationActionModal
          actionTypeOptions={[actionTarget.action]}
          targetType="post"
          targetId={actionTarget.targetId}
          reasons={['Policy violation', 'Multiple reports', 'Other']}
          onClose={() => setActionTarget(null)}
          onSuccess={() => {
            setActionTarget(null);
            loadPosts(1, true);
          }}
        />
      )}
    </div>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string }> = ({
  label,
  value,
  onChange,
  placeholder,
}) => (
  <label className="block text-sm font-semibold text-primary">
    {label}
    <div className="relative mt-2">
      <Search size={16} className="absolute left-3 top-3 text-secondary" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder={placeholder}
      />
    </div>
  </label>
);

const PostAdminCard: React.FC<{
  post: any;
  subtitle: string;
  actions: { key: string; label: string; icon: React.ReactNode; action: ActionType }[];
  onAction: (action: ActionType) => void;
  onViewReports: () => void;
}> = ({ post, subtitle, actions, onAction, onViewReports }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-secondary">@{post.user?.username || 'Unknown'} · {subtitle}</p>
          <p className="mt-2 text-primary">{post.content || 'Media-only post'}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-secondary hover:bg-background"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-border bg-surface shadow-lg">
              {actions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(action.action);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-background"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onViewReports();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-background"
              >
                <AlertTriangle size={16} />
                View Reports
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModerationActionModal: React.FC<{
  actionTypeOptions: ActionType[];
  targetType: 'post' | 'user';
  targetId: string;
  reasons: string[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ actionTypeOptions, targetType, targetId, reasons, onClose, onSuccess }) => {
  const [actionType, setActionType] = useState<ActionType>(actionTypeOptions[0]);
  const [reason, setReason] = useState(reasons[0] || 'Other');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const defaultMessage = `Action taken on the ${targetType} you reported for ${reason}: ${actionType}.`;
    setMessage(defaultMessage);
  }, [actionType, reason, targetType]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.applyModerationAction({
        targetType,
        targetId,
        actionType,
        reason,
        message,
      });
      toast.success('Moderation action applied.');
      onSuccess();
    } catch (error) {
      console.error('Failed to apply moderation action:', error);
      toast.error('Failed to apply action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-primary">Confirm Moderation Action</h3>
            <p className="text-sm text-secondary mt-1">Customize the reporter notification before sending.</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Action</label>
            <select
              value={actionType}
              onChange={(event) => setActionType(event.target.value as ActionType)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
            >
              {actionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Reason</label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
            >
              {reasons.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Message to reporters</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-secondary hover:text-primary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90 disabled:opacity-60"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportsListModal: React.FC<{ targetId: string; onClose: () => void }> = ({ targetId, onClose }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.fetchReports({ targetType: 'post', targetId, limit: 50 });
        setReports(data.reports || []);
      } catch (error) {
        console.error('Failed to load reports:', error);
        toast.error('Failed to load reports.');
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, [targetId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-primary">Reports</h3>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {isLoading && <p className="text-sm text-secondary">Loading reports...</p>}
          {!isLoading && reports.length === 0 && (
            <p className="text-sm text-secondary">No reports found.</p>
          )}
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-border bg-background p-3 text-sm">
              <p className="font-semibold text-primary">@{report.reporterId?.username}</p>
              <p className="text-secondary">Reason: {report.reason}</p>
              {report.details && <p className="text-secondary">Details: {report.details}</p>}
              <p className="text-xs text-secondary mt-2">{timeAgo(report.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
