import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-white rounded-[2rem] p-6 flex flex-col h-full shadow-sm animate-pulse">
            {/* Image placeholder */}
            <div className="aspect-video w-full bg-gray-200 rounded-2xl mb-6" />

            {/* Category badge */}
            <div className="h-3 w-24 bg-gray-200 rounded-full mb-4" />

            {/* Title */}
            <div className="h-5 w-3/4 bg-gray-200 rounded-full mb-2" />
            <div className="h-5 w-1/2 bg-gray-200 rounded-full mb-6" />

            {/* Spacer */}
            <div className="mt-auto pt-4 flex items-end justify-between">
                {/* Price */}
                <div className="h-7 w-28 bg-gray-200 rounded-full" />
                {/* Button */}
                <div className="h-10 w-28 bg-gray-200 rounded-xl" />
            </div>
        </div>
    );
};

export default SkeletonCard;
