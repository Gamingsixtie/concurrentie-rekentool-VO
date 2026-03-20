import WizardShell from './components/wizard/WizardShell.tsx';

export default function App() {
  return (
    <div className="min-h-screen bg-cito-bg">
      <main className="mx-auto max-w-[720px] py-16 px-8">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
          Rekentool VO
        </h1>
        <p className="mt-2 text-base text-neutral-500 mb-8">
          Vergelijk toetsaanbieders voor uw school
        </p>

        <WizardShell />
      </main>
    </div>
  );
}
