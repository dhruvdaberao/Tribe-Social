import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  MoreVertical,
  Search,
  Trash2,
  MessageSquare,
  User as UserIcon,
  X,
} from 'lucide-react';
import { toast } from '../../components/common/Toast';
import * as api from '../../api';
import { Report } from '../../types';

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

type ActionType = 'hide' | 'unhide' | 'delete';

const getSearchParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    view: params.get('view') || 'manage',
  };
};

const AdminUsersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { view } = getSearchParams(location.search);
  const isReportedView = view === 'reported';
  const isHiddenView = view === 'hidden';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Admin Users</h1>
            <p className="text-sm text-secondary mt-1">Review and moderate community members.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm font-semibold text-secondary hover:text-primary"
          >
            Back to Admin Settings
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <TopActionCard
            title="Reported Users"
            description="Review reports and take action"
            icon={<AlertTriangle size={18} />}
            active={isReportedView}
            onClick={() => navigate('/admin/users?view=reported')}
          />
          <TopActionCard
            title="Hidden Users"
            description="Manage hidden community members"
            icon={<EyeOff size={18} />}
            active={isHiddenView}
            onClick={() => navigate('/admin/users?view=hidden')}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {!isReportedView && !isHiddenView && <ManageUsersPanel />}
        {isReportedView && <ReportedUsersPanel />}
        {isHiddenView && <HiddenUsersPanel />}
      </div>
    </div>
  );
};

const TopActionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({
  title,
  description,
  icon,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
      active ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:bg-background'
    }`}
  >
    <div>
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="text-xs text-secondary mt-1">{description}</p>
    </div>
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-accent">
      {icon}
    </div>
  </button>
);

const ManageUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [profileModalTarget, setProfileModalTarget] = useState<any | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadUsers = useCallback(
    async (pageToLoad: number, replace = false) => {
      setIsLoading(true);
      try {
        const trimmed = search.trim();
        const isId = /^[0-9a-fA-F]{24}$/.test(trimmed);
        const { data } = await api.fetchModerationUsers({
          page: pageToLoad,
          limit: 20,
          username: trimmed.startsWith('@') ? trimmed.slice(1) : undefined,
          keyword: trimmed && !trimmed.startsWith('@') && !isId ? trimmed : undefined,
          id: isId ? trimmed : undefined,
        });
        const newUsers = data.users || [];
        setUsers((prev) => {
          const combined = replace ? newUsers : [...prev, ...newUsers];
          return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
        setHasMore(pageToLoad < data.pages);
      } catch (error) {
        toast.error('Failed to load users.');
      } finally {
        setIsLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    setPage(1);
    loadUsers(1, true);
  }, [loadUsers]);

  useEffect(() => {
    if (!loaderRef.current || isLoading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadUsers(nextPage);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadUsers, page]);

  const handleAction = async (userId: string, action: ActionType) => {
    try {
      await api.applyModerationAction({ targetType: 'user', targetId: userId, actionType: action });
      toast.success('Action applied.');
      loadUsers(1, true);
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <div className="space-y-4">
        {users.map((user) => (
          <UserAdminRow
            key={user._id || user.id}
            user={user}
            onView={() => setProfileModalTarget(user)}
            onAction={(action) => handleAction(user._id || user.id, action)}
            onViewReports={() => setReportsModalTarget(user._id || user.id)}
          />
        ))}
      </div>
      <div ref={loaderRef} className="h-8" />
      {isLoading && <p className="text-sm text-secondary">Loading more users...</p>}

      {profileModalTarget && (
        <UserProfileModal user={profileModalTarget} onClose={() => setProfileModalTarget(null)} />
      )}
      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} targetType="user" onClose={() => setReportsModalTarget(null)} />
      )}
    </div>
  );
};

const ReportedUsersPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; reasons: string[] } | null>(null);
  const [profileModalTarget, setProfileModalTarget] = useState<any | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchReports({ targetType: 'user', status: 'open', limit: 200 });
      setReports(data.reports || []);
    } catch (error) {
      toast.error('Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, { user: any; reports: Report[]; lastReportAt: string }>();
    reports.forEach((report) => {
      const target = report.targetId as any;
      const targetId = target?.id || target?._id || report.targetId;
      const existing = groups.get(targetId);
      if (existing) {
        existing.reports.push(report);
        if (report.createdAt > existing.lastReportAt) existing.lastReportAt = report.createdAt;
      } else {
        groups.set(targetId, { user: target, reports: [report], lastReportAt: report.createdAt });
      }
    });
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.lastReportAt).getTime() - new Date(a.lastReportAt).getTime()
    );
  }, [reports]);

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-secondary">Loading reports...</p>}
      {!isLoading && groupedReports.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No open reports yet.
        </div>
      )}

      {groupedReports.map(({ user, reports: userReports }) => {
        const totalReports = userReports.length;
        const reasonCounts = userReports.reduce<Record<string, number>>((acc, report) => {
          acc[report.reason] = (acc[report.reason] || 0) + 1;
          return acc;
        }, {});
        const reasons = Object.keys(reasonCounts);
        return (
          <div key={user?.id || user?._id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 text-sm text-secondary">
                  <UserAvatar user={user} size="sm" />
                  <span>
                    {user?.name || 'Unknown'} · @{user?.username || 'unknown'}
                  </span>
                </div>
                <p className="mt-2 text-primary text-sm line-clamp-2">
                  {user?.bio || 'No bio provided.'}
                </p>
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
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => setActionTarget({ targetId: user?.id || user?._id, reasons })}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90"
                  >
                    Take Action
                  </button>
                  <button
                    onClick={() => setProfileModalTarget(user)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-background"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-semibold text-primary mb-2">Reporters</p>
              <ul className="space-y-2 text-sm text-secondary">
                {userReports.map((report) => (
                  <li key={report.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      @{report.reporterId?.username} · {report.reason}
                      <ReportMessageButton details={report.details} />
                    </span>
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
          targetType="user"
          targetId={actionTarget.targetId}
          actionTypeOptions={['hide', 'delete', 'dismiss']}
          reasons={actionTarget.reasons}
          onClose={() => setActionTarget(null)}
          onSuccess={() => {
            setActionTarget(null);
            loadReports();
          }}
        />
      )}
      {profileModalTarget && (
        <UserProfileModal user={profileModalTarget} onClose={() => setProfileModalTarget(null)} />
      )}
    </div>
  );
};

const HiddenUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [profileModalTarget, setProfileModalTarget] = useState<any | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchModerationUsers({ status: 'hidden', limit: 50 });
      const sorted = (data.users || []).sort(
        (a: any, b: any) =>
          new Date(b.hiddenAt || b.lastModerationAt || b.updatedAt).getTime() -
          new Date(a.hiddenAt || a.lastModerationAt || a.updatedAt).getTime()
      );
      setUsers(sorted);
    } catch (error) {
      toast.error('Failed to load hidden users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAction = async (userId: string, action: ActionType) => {
    try {
      await api.applyModerationAction({ targetType: 'user', targetId: userId, actionType: action });
      toast.success('Action applied.');
      loadUsers();
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-secondary">Loading hidden users...</p>}
      {!isLoading && users.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No hidden users right now.
        </div>
      )}
      {users.map((user) => (
        <UserAdminRow
          key={user._id || user.id}
          user={user}
          subtitle={`Hidden ${timeAgo(user.hiddenAt)}`}
          onView={() => setProfileModalTarget(user)}
          onAction={(action) => handleAction(user._id || user.id, action)}
          onViewReports={() => setReportsModalTarget(user._id || user.id)}
        />
      ))}

      {profileModalTarget && (
        <UserProfileModal user={profileModalTarget} onClose={() => setProfileModalTarget(null)} />
      )}
      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} targetType="user" onClose={() => setReportsModalTarget(null)} />
      )}
    </div>
  );
};

const SearchInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="rounded-2xl border border-border bg-surface p-4">
    <label className="block text-sm font-semibold text-primary mb-2">
      Search users by @username, name, bio, id
    </label>
    <div className="relative">
      <Search size={16} className="absolute left-3 top-3 text-secondary" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="@username, name, bio, id"
      />
    </div>
  </div>
);

const UserAvatar: React.FC<{ user: any; size?: 'sm' | 'md' }> = ({ user, size = 'md' }) => {
  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user?.username || 'User'} className={`${dimension} rounded-full object-cover`} />;
  }
  return (
    <div className={`${dimension} rounded-full bg-border flex items-center justify-center text-xs font-semibold text-secondary`}>
      {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
    </div>
  );
};

const UserAdminRow: React.FC<{
  user: any;
  subtitle?: string;
  onView: () => void;
  onAction: (action: ActionType) => void;
  onViewReports: () => void;
}> = ({ user, subtitle, onView, onAction, onViewReports }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHidden = !!user.isHidden;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <UserAvatar user={user} />
          <div>
            <p className="text-sm font-semibold text-primary flex items-center gap-2">
              {user.name || 'Unknown'}
              <span className="text-xs text-secondary">@{user.username || 'unknown'}</span>
            </p>
            <p className="text-xs text-secondary mt-1 line-clamp-1">{user.bio || 'No bio provided.'}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-secondary">
              {subtitle && <span>{subtitle}</span>}
              {(user.id || user._id) && <span>ID: {user.id || user._id}</span>}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-secondary hover:bg-background"
            aria-label="User actions"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-border bg-surface shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onView();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-background"
              >
                <UserIcon size={16} />
                View Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onAction(isHidden ? 'unhide' : 'hide');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-background"
              >
                {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                {isHidden ? 'Unhide' : 'Hide'}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onAction('delete');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Delete
              </button>
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

const UserProfileModal: React.FC<{ user: any; onClose: () => void }> = ({ user, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl">
      <button
        onClick={onClose}
        className="absolute -top-4 -right-4 rounded-full bg-surface p-2 text-primary shadow-lg"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-4">
        <UserAvatar user={user} size="md" />
        <div>
          <h3 className="text-xl font-bold text-primary">{user.name || 'Unknown'}</h3>
          <p className="text-sm text-secondary">@{user.username || 'unknown'}</p>
          <p className="mt-3 text-sm text-primary whitespace-pre-wrap">{user.bio || 'No bio provided.'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-secondary">
            {(user.id || user._id) && <span>ID: {user.id || user._id}</span>}
            {user.createdAt && <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ReportMessageButton: React.FC<{ details?: string }> = ({ details }) => {
  const [open, setOpen] = useState(false);
  const message = details?.trim() || 'No message provided.';

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-secondary hover:text-primary"
        aria-label="View report message"
      >
        <MessageSquare size={14} />
      </button>
      {open && (
        <span className="absolute z-10 mt-8 w-48 rounded-lg border border-border bg-surface p-2 text-xs text-secondary shadow-lg">
          {message}
        </span>
      )}
    </span>
  );
};

const ReportsListModal: React.FC<{ targetId: string; targetType: 'user' | 'tribe'; onClose: () => void }> = ({
  targetId,
  targetType,
  onClose,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.fetchReports({ targetType, targetId, limit: 50 });
        setReports(data.reports || []);
      } catch (error) {
        toast.error('Failed to load reports.');
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, [targetId, targetType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary">Reports</h3>
            <p className="text-xs text-secondary mt-1">Total reports: {reports.length}</p>
          </div>
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
              <div className="flex items-center justify-between">
                <p className="font-semibold text-primary">@{report.reporterId?.username}</p>
                <span className="text-xs text-secondary">{timeAgo(report.createdAt)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-secondary">
                <span>{report.reason}</span>
                <ReportMessageButton details={report.details} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ModerationActionModal: React.FC<{
  targetType: 'user' | 'tribe';
  targetId: string;
  actionTypeOptions: Array<'hide' | 'delete' | 'dismiss'>;
  reasons: string[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ targetType, targetId, actionTypeOptions, reasons, onClose, onSuccess }) => {
  const [actionType, setActionType] = useState(actionTypeOptions[0]);
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
      await api.applyModerationAction({ targetType, targetId, actionType, reason, message });
      toast.success('Moderation action applied.');
      onSuccess();
    } catch (error) {
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
              onChange={(event) => setActionType(event.target.value as 'hide' | 'delete' | 'dismiss')}
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

export default AdminUsersPage;
