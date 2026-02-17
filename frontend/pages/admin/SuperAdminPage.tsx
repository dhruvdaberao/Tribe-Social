import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, MessageSquare, MoreVertical, Search, ShieldCheck, Trash2, UserPlus, X, Flag } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import * as api from '../../api';
import { Report, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

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

type ActionType = 'hide' | 'unhide' | 'delete' | 'dismiss';

type ViewType = 'leaders' | 'reported';

const getSearchParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    view: (params.get('view') as ViewType) || 'leaders',
  };
};

const SuperAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { view } = getSearchParams(location.search);
  const isLeadersView = view === 'leaders';
  const isReportedView = view === 'reported';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Super Admin</h1>
            <p className="text-sm text-secondary mt-1">Manage admins and review escalations.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm font-semibold text-secondary hover:text-primary"
          >
            Back to Admin Settings
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <TopActionCard
            title="Admin Leaders"
            description="Promote, demote, and manage admins"
            icon={<ShieldCheck size={18} />}
            active={isLeadersView}
            onClick={() => navigate('/admin/super?view=leaders')}
          />
          <TopActionCard
            title="Reports"
            description="Review all reports across entities"
            icon={<Flag size={18} />}
            active={false}
            onClick={() => navigate('/super-admin/reports')}
          />
          <TopActionCard
            title="Reported Admins"
            description="Review escalations from moderators"
            icon={<AlertTriangle size={18} />}
            active={isReportedView}
            onClick={() => navigate('/admin/super?view=reported')}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {isLeadersView && <AdminLeadersPanel />}
        {isReportedView && <ReportedAdminsPanel />}
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

const AdminLeadersPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ user: User; action: ActionType } | null>(null);

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchModerationUsers({ role: 'admin', limit: 200 });
      const list = data.users || [];
      setAdmins(list);
    } catch (error) {
      toast.error('Failed to load admins.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleRoleUpdate = async (userId: string, payload: { isAdmin?: boolean; isSuperAdmin?: boolean }) => {
    try {
      await api.updateUserRole(userId, payload);
      toast.success('Admin role updated.');
      loadAdmins();
    } catch (error) {
      toast.error('Failed to update admin role.');
    }
  };

  const handleModerationAction = async (userId: string, action: ActionType) => {
    try {
      await api.applyModerationAction({ targetType: 'user', targetId: userId, actionType: action });
      toast.success('Admin updated.');
      loadAdmins();
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">Admin Leaders</h2>
          <p className="text-sm text-secondary">Manage admin access and enforcement.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-semibold text-accent-text hover:bg-accent/90"
        >
          <UserPlus size={18} />
          Create Admin
        </button>
      </div>

      {isLoading && <p className="text-sm text-secondary">Loading admins...</p>}
      {!isLoading && admins.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No admins found.
        </div>
      )}

      <div className="space-y-4">
        {admins.map((admin) => {
          const adminId = (admin as any)._id || admin.id;
          return (
            <AdminLeaderRow
              key={adminId}
              admin={admin}
              canEditRoles={adminId !== currentUser?.id || !admin.isSuperAdmin}
              onDisable={() => setActionTarget({ user: admin, action: admin.isDisabled ? 'unhide' : 'hide' })}
              onDelete={() => setActionTarget({ user: admin, action: 'delete' })}
              onRemoveAdmin={() => handleRoleUpdate(adminId, { isAdmin: false })}
              onPromoteSuperAdmin={() => handleRoleUpdate(adminId, { isSuperAdmin: true })}
            />
          );
        })}
      </div>

      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onPromote={(userId) => handleRoleUpdate(userId, { isAdmin: true })}
        />
      )}

      {actionTarget && (
        <ConfirmActionModal
          title={actionTarget.action === 'delete' ? 'Delete Admin' : actionTarget.user.isDisabled ? 'Enable Admin' : 'Disable Admin'}
          description={
            actionTarget.action === 'delete'
              ? 'This will permanently delete the admin account.'
              : actionTarget.user.isDisabled
                ? 'This will re-enable the admin account.'
                : 'This will disable the admin account and block access.'
          }
          confirmLabel={actionTarget.action === 'delete' ? 'Delete' : actionTarget.user.isDisabled ? 'Enable' : 'Disable'}
          onClose={() => setActionTarget(null)}
          onConfirm={() => {
            handleModerationAction((actionTarget.user as any)._id || actionTarget.user.id, actionTarget.action);
            setActionTarget(null);
          }}
        />
      )}
    </div>
  );
};

const AdminLeaderRow: React.FC<{
  admin: User;
  canEditRoles: boolean;
  onDisable: () => void;
  onDelete: () => void;
  onRemoveAdmin: () => void;
  onPromoteSuperAdmin: () => void;
}> = ({ admin, canEditRoles, onDisable, onDelete, onRemoveAdmin, onPromoteSuperAdmin }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary flex items-center gap-2">
            {admin.name || 'Unknown'}
            <span className="text-xs text-secondary">@{admin.username}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {admin.isSuperAdmin ? (
              <Badge icon={<Crown size={12} />} label="Super Admin" />
            ) : (
              <Badge icon={<ShieldCheck size={12} />} label="Admin" />
            )}
            {admin.isDisabled && <Badge label="Disabled" tone="danger" />}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-secondary hover:bg-background"
            aria-label="Admin actions"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-border bg-surface shadow-lg">
              {!admin.isSuperAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (canEditRoles) onRemoveAdmin();
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${canEditRoles ? 'text-primary hover:bg-background' : 'text-secondary cursor-not-allowed'}`}
                  disabled={!canEditRoles}
                >
                  Remove Admin
                </button>
              )}
              {!admin.isSuperAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (canEditRoles) onPromoteSuperAdmin();
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${canEditRoles ? 'text-primary hover:bg-background' : 'text-secondary cursor-not-allowed'}`}
                  disabled={!canEditRoles}
                >
                  Promote to Super Admin
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDisable();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-background"
              >
                {admin.isDisabled ? 'Enable Admin' : 'Disable Admin'}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Delete Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateAdminModal: React.FC<{ onClose: () => void; onPromote: (userId: string) => void }> = ({ onClose, onPromote }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const trimmed = search.trim();
      const isId = /^[0-9a-fA-F]{24}$/.test(trimmed);
      const { data } = await api.fetchModerationUsers({
        limit: 20,
        username: trimmed.startsWith('@') ? trimmed.slice(1) : undefined,
        keyword: trimmed && !trimmed.startsWith('@') && !isId ? trimmed : undefined,
        id: isId ? trimmed : undefined,
      });
      const list = (data.users || []).filter((user: User) => !user.isAdmin);
      setResults(list);
    } catch (error) {
      toast.error('Failed to search users.');
    } finally {
      setIsSearching(false);
    }
  }, [search]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    handleSearch();
  }, [handleSearch, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary">Create New Admin</h3>
            <p className="text-xs text-secondary mt-1">Search users to promote to admin.</p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-secondary" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="@username, name, email, id"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-[45vh] overflow-y-auto">
          {isSearching && <p className="text-sm text-secondary">Searching...</p>}
          {!isSearching && results.length === 0 && search.trim() && (
            <p className="text-sm text-secondary">No users found.</p>
          )}
          {results.map((user) => {
            const userId = (user as any)._id || user.id;
            return (
            <div key={userId} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-sm">
              <div>
                <p className="font-semibold text-primary">{user.name}</p>
                <p className="text-xs text-secondary">@{user.username}</p>
              </div>
              <button
                onClick={() => onPromote(userId)}
                className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-text hover:bg-accent/90"
              >
                Make Admin
              </button>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
};

const ReportedAdminsPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; action: ActionType } | null>(null);
  const [roleTarget, setRoleTarget] = useState<string | null>(null);

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
      if (!target?.isAdmin && !target?.isSuperAdmin) return;
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

  const handleModerationAction = async (targetId: string, action: ActionType) => {
    try {
      await api.applyModerationAction({ targetType: 'user', targetId, actionType: action });
      toast.success('Moderation action applied.');
      loadReports();
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  const handleRoleRemoval = async (targetId: string) => {
    try {
      await api.updateUserRole(targetId, { isAdmin: false });
      toast.success('Admin role removed.');
      loadReports();
    } catch (error) {
      toast.error('Failed to remove admin role.');
    }
  };

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-secondary">Loading reported admins...</p>}
      {!isLoading && groupedReports.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No reported admins right now.
        </div>
      )}

      {groupedReports.map(({ user, reports: adminReports }) => {
        const totalReports = adminReports.length;
        const reasonCounts = adminReports.reduce<Record<string, number>>((acc, report) => {
          acc[report.reason] = (acc[report.reason] || 0) + 1;
          return acc;
        }, {});
        const reasons = Object.keys(reasonCounts);
        const hasEscalation = adminReports.some((report) => report.escalatedToSuperAdmin);
        return (
          <div key={user?.id || user?._id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-2">
                  {user?.name || 'Unknown'}
                  <span className="text-xs text-secondary">@{user?.username || 'unknown'}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.isSuperAdmin ? (
                    <Badge icon={<Crown size={12} />} label="Super Admin" />
                  ) : (
                    <Badge icon={<ShieldCheck size={12} />} label="Admin" />
                  )}
                  {hasEscalation && <Badge label="Escalated" tone="warning" />}
                </div>
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
                    onClick={() => setActionTarget({ targetId: user?.id || user?._id, action: 'dismiss' })}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-background"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setActionTarget({ targetId: user?.id || user?._id, action: user?.isDisabled ? 'unhide' : 'hide' })}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90"
                  >
                    {user?.isDisabled ? 'Enable Admin' : 'Disable Admin'}
                  </button>
                  <button
                    onClick={() => setRoleTarget(user?.id || user?._id)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-background"
                  >
                    Remove Admin Role
                  </button>
                  <button
                    onClick={() => setActionTarget({ targetId: user?.id || user?._id, action: 'delete' })}
                    className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                  >
                    Delete Admin
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-semibold text-primary mb-2">Reporters</p>
              <ul className="space-y-2 text-sm text-secondary">
                {adminReports.map((report) => (
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
        <ConfirmActionModal
          title={actionTarget.action === 'delete' ? 'Delete Admin' : actionTarget.action === 'dismiss' ? 'Dismiss Reports' : 'Disable Admin'}
          description={
            actionTarget.action === 'delete'
              ? 'This will permanently delete the admin account.'
              : actionTarget.action === 'dismiss'
                ? 'This will dismiss all open reports for this admin.'
                : 'This will disable the admin account and block access.'
          }
          confirmLabel={actionTarget.action === 'dismiss' ? 'Dismiss' : actionTarget.action === 'delete' ? 'Delete' : 'Disable'}
          onClose={() => setActionTarget(null)}
          onConfirm={() => {
            handleModerationAction(actionTarget.targetId, actionTarget.action);
            setActionTarget(null);
          }}
        />
      )}
      {roleTarget && (
        <ConfirmActionModal
          title="Remove Admin Role"
          description="This will demote the admin to a normal user."
          confirmLabel="Remove"
          onClose={() => setRoleTarget(null)}
          onConfirm={() => {
            handleRoleRemoval(roleTarget);
            setRoleTarget(null);
          }}
        />
      )}
    </div>
  );
};

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

const Badge: React.FC<{ label: string; icon?: React.ReactNode; tone?: 'default' | 'warning' | 'danger' }> = ({
  label,
  icon,
  tone = 'default',
}) => {
  const toneClasses =
    tone === 'warning'
      ? 'bg-yellow-500/10 text-yellow-400'
      : tone === 'danger'
        ? 'bg-red-500/10 text-red-400'
        : 'bg-accent/10 text-accent';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
      {icon}
      {label}
    </span>
  );
};

const ConfirmActionModal: React.FC<{
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ title, description, confirmLabel, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-sm text-secondary mt-1">{description}</p>
        </div>
        <button onClick={onClose} className="text-secondary hover:text-primary">
          <X size={18} />
        </button>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-secondary hover:text-primary">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default SuperAdminPage;
