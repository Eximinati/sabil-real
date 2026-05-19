'use client';

function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-[var(--color-border)] via-[var(--color-bg)] to-[var(--color-border)] bg-[length:200%_100%] rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-bg) 50%, var(--color-border) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
}

const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export function LessonHeaderSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-24 h-5" />
      </div>
      <div className="mt-6">
        <Skeleton className="w-20 h-4 mb-2" />
        <Skeleton className="w-3/4 h-8 mb-2" />
        <Skeleton className="w-1/2 h-5" />
      </div>
      <Skeleton className="h-px w-full mt-6" />
    </div>
  );
}

export function VerseSectionSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-9 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="flex justify-end mb-2">
              <Skeleton className="w-12 h-4" />
            </div>
            <Skeleton className="w-full h-6 mb-2" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HadithSectionSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <Skeleton className="w-32 h-6 mb-4" />
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-24 h-5" />
          <Skeleton className="w-12 h-5 rounded" />
        </div>
        <Skeleton className="w-full h-8 mb-2" />
        <Skeleton className="h-px w-full my-4" />
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-4/5 h-4" />
      </div>
    </div>
  );
}

export function LessonTextSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <Skeleton className="w-24 h-6 mb-4" />
      <div className="space-y-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
      </div>
    </div>
  );
}

export function ReflectionSectionSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <Skeleton className="w-28 h-6 mb-4" />
      <div className="bg-[var(--color-bg)] rounded-xl p-5 border border-[var(--color-primary)]/20">
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      <Skeleton className="w-full h-24 mt-4 rounded-lg" />
    </div>
  );
}

export function CompleteButtonSkeleton() {
  return (
    <div className="mt-8">
      <style>{shimmerStyle}</style>
      <Skeleton className="w-full h-12 rounded-lg" />
    </div>
  );
}

export function TafsirSectionSkeleton() {
  return (
    <div className="mb-8">
      <style>{shimmerStyle}</style>
      <div className="flex items-center justify-between w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-16 h-5" />
        </div>
        <Skeleton className="w-5 h-5" />
      </div>
    </div>
  );
}