interface PosterGridSkeletonProps {
  count?: number;
}

export default function PosterGridSkeleton({ count = 12 }: PosterGridSkeletonProps) {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-[10px]" style={{ aspectRatio: '2/3' }} />
      ))}
    </div>
  );
}
