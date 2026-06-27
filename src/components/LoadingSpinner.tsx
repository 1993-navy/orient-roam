// X-style loading spinner - clean and minimal
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-neutral-200 border-t-rose-600 dark:border-neutral-700 dark:border-t-rose-400" />
    </div>
  );
}

// X-style loading skeleton with shimmer effect
export function LoadingSkeleton({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer h-4 rounded bg-neutral-200 dark:bg-neutral-800"
          style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// X-style full-page loading state
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-400 animate-pulse-soft">Loading...</p>
    </div>
  );
}