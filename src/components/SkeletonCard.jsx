import React, { memo } from 'react';

/**
 * SkeletonCard — mirrors the exact layout of ProductCard.
 * Uses a gradient shimmer animation for the loading state.
 */
const SkeletonCard = () => (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100/80">
        {/* Image placeholder — aspect-[4/3] matches ProductCard */}
        <div className="w-full aspect-[16/9] md:aspect-[4/3] shimmer" />

        {/* Content area */}
        <div className="flex-1 flex flex-col px-5 pt-5 pb-5 gap-3">
            {/* Category label */}
            <div className="shimmer h-3 w-20 rounded-full" />

            {/* Title lines */}
            <div className="shimmer h-5 w-full rounded-lg" />
            <div className="shimmer h-5 w-3/4 rounded-lg" />

            {/* Description lines */}
            <div className="shimmer h-3.5 w-full rounded-md mt-1" />
            <div className="shimmer h-3.5 w-5/6 rounded-md" />

            {/* Spacer */}
            <div className="flex-1 min-h-[16px]" />

            {/* Footer — price + buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="shimmer h-7 w-24 rounded-lg" />
                <div className="flex gap-2">
                    <div className="shimmer h-9 w-9 rounded-full" />
                    <div className="shimmer h-9 w-28 rounded-full" />
                </div>
            </div>
        </div>
    </div>
);

export default memo(SkeletonCard);
