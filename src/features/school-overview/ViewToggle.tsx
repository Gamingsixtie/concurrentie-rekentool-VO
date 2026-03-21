interface ViewToggleProps {
  activeView: 'list' | 'pipeline';
  onViewChange: (view: 'list' | 'pipeline') => void;
}

export default function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  const buttonBase = 'min-h-[44px] px-4 rounded-lg inline-flex items-center gap-2 text-[14px] font-medium transition-colors';
  const activeClass = 'bg-cito-primary text-white';
  const inactiveClass = 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50';

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`${buttonBase} ${activeView === 'list' ? activeClass : inactiveClass}`}
        aria-label="Lijstweergave"
      >
        {/* Grid / list icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        Lijst
      </button>

      <button
        type="button"
        onClick={() => onViewChange('pipeline')}
        className={`${buttonBase} ${activeView === 'pipeline' ? activeClass : inactiveClass}`}
        aria-label="Pipelineweergave"
      >
        {/* Kanban icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="6" height="18" rx="1" />
          <rect x="9" y="3" width="6" height="12" rx="1" />
          <rect x="16" y="3" width="6" height="15" rx="1" />
        </svg>
        Pipeline
      </button>
    </div>
  );
}
