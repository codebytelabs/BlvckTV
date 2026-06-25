import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export default function Carousel({ title, children, action }: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group/row">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-[#f1f1f4] tracking-tight">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[12px] font-semibold text-[#8b5cf6] hover:text-[#06b6d4] transition-colors"
          >
            {action.label} &rarr;
          </button>
        )}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[rgba(10,10,15,0.8)] backdrop-blur-sm border border-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4] opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-[rgba(139,92,246,0.3)]"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[rgba(10,10,15,0.8)] backdrop-blur-sm border border-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4] opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-[rgba(139,92,246,0.3)]"
        >
          <ChevronRight size={18} />
        </button>

        {/* Items container */}
        <div
          ref={containerRef}
          className="carousel-container pb-2"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
