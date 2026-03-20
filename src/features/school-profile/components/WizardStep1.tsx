import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schoolTypeSchema, type SchoolTypeData } from '../schemas/step1-schema.ts';
import { SCHOOL_LEVELS, SCHOOL_LEVEL_LABELS } from '../../../models/school.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import { useImperativeHandle, forwardRef } from 'react';

export interface WizardStepRef {
  submit: () => Promise<boolean>;
}

const WizardStep1 = forwardRef<WizardStepRef>(function WizardStep1(_props, ref) {
  const { levels, setLevels } = useSchoolProfileStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolTypeData>({
    resolver: zodResolver(schoolTypeSchema),
    defaultValues: {
      levels: levels,
    },
  });

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            setLevels(data.levels);
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Welke niveaus biedt uw school aan?">
      <div className="space-y-0">
        {SCHOOL_LEVELS.map((level) => (
          <label
            key={level}
            className="flex items-center w-full h-12 px-4 cursor-pointer hover:bg-neutral-50 rounded-md"
          >
            <input
              type="checkbox"
              value={level}
              {...register('levels')}
              className="
                w-5 h-5 rounded border-2 border-neutral-200
                checked:bg-cito-primary checked:border-cito-primary
                focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
                cursor-pointer accent-cito-primary
              "
            />
            <span className="ml-3 text-base text-neutral-900">
              {SCHOOL_LEVEL_LABELS[level]}
            </span>
          </label>
        ))}
      </div>

      {errors.levels && (
        <p className="mt-3 text-[14px] text-red-600" role="alert">
          {errors.levels.message}
        </p>
      )}
    </StepContainer>
  );
});

export default WizardStep1;
