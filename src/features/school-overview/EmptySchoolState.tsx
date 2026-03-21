import AddSchoolButton from './AddSchoolButton';

export default function EmptySchoolState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-[20px] font-semibold text-neutral-900">
        Nog geen schoolprofielen
      </h2>
      <p className="mt-4 text-base text-neutral-500 max-w-[360px] text-center">
        Maak uw eerste schoolprofiel aan om prijsvergelijkingen op te slaan.
      </p>
      <div className="mt-6">
        <AddSchoolButton />
      </div>
    </div>
  );
}
