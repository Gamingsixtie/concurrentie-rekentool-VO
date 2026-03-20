interface DisclaimerFooterProps {
  showDisclaimer?: boolean;
}

export function DisclaimerFooter({ showDisclaimer = true }: DisclaimerFooterProps) {
  if (!showDisclaimer) return null;

  return (
    <p className="text-sm text-neutral-500 italic mt-8">
      Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.
    </p>
  );
}
