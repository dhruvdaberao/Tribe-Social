import React from 'react';
import Skeleton from '../common/Skeleton';

const PostSkeleton = () => {
    return (
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-center mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="ml-4 space-y-2">
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" width={80} />
                </div>
                <div className="ml-auto">
                    <Skeleton variant="circular" width={32} height={32} />
                </div>
            </div>
            <div className="space-y-2 mb-4">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="95%" />
            </div>
            <div className="w-full h-64 rounded-xl overflow-hidden mb-4">
                <Skeleton variant="rectangular" width="100%" height="100%" />
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={60} />
            </div>
        </div>
    );
};

export default PostSkeleton;
