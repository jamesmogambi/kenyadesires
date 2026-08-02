import { cn } from "@/lib/utils";

interface AgenciesLoadingSkeletonProps {
    className?: string;
    title: string;
    itemCount?: number;
}

export default function AgenciesLoadingSkeleton({
    className,
    title,
    itemCount = 6,
}: AgenciesLoadingSkeletonProps) {
    return (
        <div className={cn("w-full", className)}>
            <h5 className="my-6 text-3xl tracking-wide text-white font-semibold text-center">
                {title}
            </h5>
            <div
                className={cn(
                    "grid grid-cols-1 mx-6 lg:mx-auto my-6 max-w-7xl lg:grid-cols-2 gap-3 lg:gap-6",
                    className,
                )}
            >
                {Array.from({ length: itemCount }).map((_, i) => (
                    <div
                        key={i}
                        className="border border-white/20 rounded-md h-150 lg:h-102.5 animate-pulse flex flex-col lg:flex-row gap-1.5 bg-gray-900/30"
                    >
                        <div className="w-full h-150 lg:h-full lg:w-1/2 bg-gray-800/50 rounded-t-md lg:rounded-l-md lg:rounded-tr-none flex-shrink-0" />
                        <div className="w-full p-6 h-full lg:w-1/2 flex flex-col gap-4">
                            <div className="h-8 bg-gray-700/50 rounded w-3/4 mb-4" />
                            <div className="h-6 bg-gray-700/50 rounded w-1/2 mb-4" />
                            <div className="h-4 bg-gray-700/50 rounded w-full mb-2" />
                            <div className="h-4 bg-gray-700/50 rounded w-5/6 mb-2" />
                            <div className="h-4 bg-gray-700/50 rounded w-2/3 mt-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}