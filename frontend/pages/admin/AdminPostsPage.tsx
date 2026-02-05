import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, FileText, MoreVertical, Search, Trash2, MessageSquare, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import PostCard from '../../components/feed/PostCard';
import * as api from '../../api';
import { Report, User } from '../../types';

type ActionType = 'hide' | 'unhide' | 'delete';

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

const normalizePost = (post: any) => ({
  ...post,
  id: post.id || post._id,
  author: post.author || post.user,
  timestamp: post.timestamp || post.createdAt,
  content: post.content || '',
  likes: post.likes || [],
  comments: post.comments || [],
});

const getSearchParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    view: params.get('view') || 'manage',
  };
};

const AdminPostsPage: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
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
            <h1 className="text-2xl font-bold font-display text-primary">Admin Posts</h1>
            <p className="text-sm text-secondary mt-1">Review and moderate community content.</p>
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
            title="Reported Posts"
            description="Review reports and take action"
            icon={<AlertTriangle size={18} />}
            active={isReportedView}
            onClick={() => navigate('/admin/posts?view=reported')}
          />
          <TopActionCard
            title="Hidden Posts"
            description="Manage content hidden by admins"
            icon={<EyeOff size={18} />}
            active={isHiddenView}
            onClick={() => navigate('/admin/posts?view=hidden')}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {!isReportedView && !isHiddenView && <ManagePostsPanel currentUser={currentUser} />}
        {isReportedView && <ReportedPostsPanel currentUser={currentUser} />}
        {isHiddenView && <HiddenPostsPanel currentUser={currentUser} />}
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

const ManagePostsPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [postModalTarget, setPostModalTarget] = useState<any | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = useCallback(
    async (pageToLoad: number, replace = false) => {
      setIsLoading(true);
      try {
        const { data } = await api.fetchModerationPosts({
          page: pageToLoad,
          limit: 20,
          keyword: search || undefined,
          username: search.startsWith('@') ? search.slice(1) : undefined,
          tags: search.includes('#') ? search.replace(/#/g, '') : undefined,
        });
        const newPosts = data.posts || [];
        setPosts((prev) => {
          const combined = replace ? newPosts : [...prev, ...newPosts];
          return combined.sort(
            (a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()
          );
        });
        setHasMore(pageToLoad < data.pages);
      } catch (error) {
        toast.error('Failed to load posts.');
      } finally {
        setIsLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    setPage(1);
    loadPosts(1, true);
  }, [loadPosts]);

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

  const handleAction = async (postId: string, action: ActionType) => {
    try {
      if (action === 'hide') {
        await api.hidePost(postId);
        toast.success('Post hidden.');
      } else if (action === 'unhide') {
        await api.unhidePost(postId);
        toast.success('Post unhidden.');
      } else {
        await api.deletePost(postId);
        toast.success('Post deleted.');
      }
      loadPosts(1, true);
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-4">
      <SearchInput value={search} onChange={setSearch} />
      <div className="space-y-4">
        {posts.map((post) => (
          <PostAdminRow
            key={post._id}
            post={post}
            onView={() => setPostModalTarget(post)}
            onAction={(action) => handleAction(post._id, action)}
            onViewReports={() => setReportsModalTarget(post._id)}
          />
        ))}
      </div>
      <div ref={loaderRef} className="h-8" />
      {isLoading && <p className="text-sm text-secondary">Loading more posts...</p>}

      {postModalTarget && currentUser && (
        <PostPreviewModal
          post={normalizePost(postModalTarget)}
          currentUser={currentUser}
          onClose={() => setPostModalTarget(null)}
        />
      )}
      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} onClose={() => setReportsModalTarget(null)} />
      )}
    </div>
  );
};

const ReportedPostsPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ targetId: string; reasons: string[] } | null>(null);
  const [postModalTarget, setPostModalTarget] = useState<any | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchReports({ targetType: 'post', status: 'open', limit: 200 });
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
    const groups = new Map<string, { post: any; reports: Report[]; lastReportAt: string }>();
    reports.forEach((report) => {
      const target = report.targetId as any;
      const targetId = target?.id || target?._id || report.targetId;
      const existing = groups.get(targetId);
      if (existing) {
        existing.reports.push(report);
        if (report.createdAt > existing.lastReportAt) existing.lastReportAt = report.createdAt;
      } else {
        groups.set(targetId, { post: target, reports: [report], lastReportAt: report.createdAt });
      }
    });
    return Array.from(groups.values()).sort((a, b) => new Date(b.lastReportAt).getTime() - new Date(a.lastReportAt).getTime());
  }, [reports]);

  return (
    <div className="space-y-4">
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
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <FileText size={16} className="text-accent" />
                  <span>@{post?.user?.username || 'Unknown'} · {timeAgo(post?.createdAt)}</span>
                </div>
                <PostPreview content={post?.content} hasMedia={!!post?.imageUrl || !!post?.mediaType} />
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
                    onClick={() => setActionTarget({ targetId: post?.id || post?._id, reasons })}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90"
                  >
                    Take Action
                  </button>
                  <button
                    onClick={() => setPostModalTarget(post)}
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
                {postReports.map((report) => (
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
      {postModalTarget && currentUser && (
        <PostPreviewModal
          post={normalizePost(postModalTarget)}
          currentUser={currentUser}
          onClose={() => setPostModalTarget(null)}
        />
      )}
    </div>
  );
};

const HiddenPostsPanel: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportsModalTarget, setReportsModalTarget] = useState<string | null>(null);
  const [postModalTarget, setPostModalTarget] = useState<any | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.fetchModerationPosts({ status: 'hidden', limit: 50 });
      const sorted = (data.posts || []).sort(
        (a: any, b: any) =>
          new Date(b.hiddenAt || b.lastModerationAt || b.updatedAt).getTime() -
          new Date(a.hiddenAt || a.lastModerationAt || a.updatedAt).getTime()
      );
      setPosts(sorted);
    } catch (error) {
      toast.error('Failed to load hidden posts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleAction = async (postId: string, action: ActionType) => {
    try {
      if (action === 'hide') {
        await api.hidePost(postId);
        toast.success('Post hidden.');
      } else if (action === 'unhide') {
        await api.unhidePost(postId);
        toast.success('Post unhidden.');
      } else {
        await api.deletePost(postId);
        toast.success('Post deleted.');
      }
      loadPosts();
    } catch (error) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-secondary">Loading hidden posts...</p>}
      {!isLoading && posts.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-secondary">
          No hidden posts right now.
        </div>
      )}
      {posts.map((post) => (
        <PostAdminRow
          key={post._id}
          post={post}
          onView={() => setPostModalTarget(post)}
          onAction={(action) => handleAction(post._id, action)}
          onViewReports={() => setReportsModalTarget(post._id)}
        />
      ))}

      {postModalTarget && currentUser && (
        <PostPreviewModal
          post={normalizePost(postModalTarget)}
          currentUser={currentUser}
          onClose={() => setPostModalTarget(null)}
        />
      )}
      {reportsModalTarget && (
        <ReportsListModal targetId={reportsModalTarget} onClose={() => setReportsModalTarget(null)} />
      )}
    </div>
  );
};

const SearchInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="rounded-2xl border border-border bg-surface p-4">
    <label className="block text-sm font-semibold text-primary mb-2">
      Search posts by @username, hashtag, keyword
    </label>
    <div className="relative">
      <Search size={16} className="absolute left-3 top-3 text-secondary" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="@username, #tag, keyword"
      />
    </div>
  </div>
);

const PostPreview: React.FC<{ content?: string; hasMedia: boolean }> = ({ content, hasMedia }) => {
  if (!content && hasMedia) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-secondary">
        <ImageIcon size={16} className="text-accent" />
        <span>Media post</span>
      </div>
    );
  }
  return (
    <p className="mt-2 text-primary text-sm line-clamp-2 whitespace-pre-wrap">
      {content || 'Media post'}
    </p>
  );
};

const PostAdminRow: React.FC<{
  post: any;
  onView: () => void;
  onAction: (action: ActionType) => void;
  onViewReports: () => void;
}> = ({ post, onView, onAction, onViewReports }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHidden = !!post.isHidden;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-secondary">@{post.user?.username || 'Unknown'} · {timeAgo(post.createdAt)}</p>
          <PostPreview content={post.content} hasMedia={!!post.imageUrl || !!post.mediaType} />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full p-2 text-secondary hover:bg-background"
            aria-label="Post actions"
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
                <Eye size={16} />
                View Post
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

const PostPreviewModal: React.FC<{ post: any; currentUser: User; onClose: () => void }> = ({ post, currentUser, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="relative w-full max-w-2xl">
      <button
        onClick={onClose}
        className="absolute -top-4 -right-4 rounded-full bg-surface p-2 text-primary shadow-lg"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <PostCard
        post={post}
        currentUser={currentUser}
        allUsers={[]}
        allTribes={[]}
        onLike={() => {}}
        onComment={() => {}}
        onDeletePost={() => {}}
        onDeleteComment={() => {}}
        onViewProfile={() => {}}
        onSharePost={() => {}}
        onReportPost={() => {}}
      />
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
  targetType: 'post' | 'user';
  targetId: string;
  reasons: string[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ targetType, targetId, reasons, onClose, onSuccess }) => {
  const [actionType, setActionType] = useState<ActionType>('hide');
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
              {['hide', 'delete', 'dismiss', 'warn'].map((option) => (
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

export default AdminPostsPage;
