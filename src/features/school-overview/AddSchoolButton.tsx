import { useNavigate } from '@tanstack/react-router';
import { createSchool } from '@/db/operations';

export default function AddSchoolButton() {
  const navigate = useNavigate();

  const handleClick = async () => {
    const school = await createSchool('Nieuw schoolprofiel');
    navigate({
      to: '/scholen/$slug/wizard/$step',
      params: { slug: school.slug, step: '1' },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-cito-accent text-white font-semibold h-[44px] px-4 rounded-lg hover:bg-[#E55B00] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      School toevoegen
    </button>
  );
}
