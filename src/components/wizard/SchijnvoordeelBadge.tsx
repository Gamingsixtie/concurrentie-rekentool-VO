interface SchijnvoordeelBadgeProps {
  warnings: string[];
}

export default function SchijnvoordeelBadge({ warnings }: SchijnvoordeelBadgeProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-amber-700">{w}</p>
      ))}
    </div>
  );
}
