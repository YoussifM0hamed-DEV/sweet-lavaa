import { forwardRef, useId, useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { cn } from '../../utils/cn.js';

const Input = forwardRef(
  ({ label, error, hint, icon: Icon, type = 'text', className, containerClassName, required, ...props }, ref) => {
    const id = useId();
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && revealed ? 'text' : type;

    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={id} className="label">
            {label}
            {required && <span className="ml-0.5 text-caramel-600">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-300" aria-hidden="true" />
          )}
          <input
            ref={ref}
            id={id}
            type={inputType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn('input', Icon && 'pl-10', isPassword && 'pr-11', error && 'input-error', className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-cocoa-300 transition-colors hover:text-cocoa-600"
              aria-label={revealed ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {revealed ? <FiEyeOff /> : <FiEye />}
            </button>
          )}
        </div>

        {error ? (
          <p id={`${id}-error`} className="field-error">
            <FiAlertCircle className="shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] text-cocoa-300">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export const Textarea = forwardRef(({ label, error, hint, className, required, rows = 4, ...props }, ref) => {
  const id = useId();
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-caramel-600">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn('input resize-y', error && 'input-error', className)}
        {...props}
      />
      {error ? (
        <p className="field-error">
          <FiAlertCircle className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.8rem] text-cocoa-300">{hint}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ label, error, hint, options = [], className, required, children, ...props }, ref) => {
  const id = useId();
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-caramel-600">*</span>}
        </label>
      )}
      <select ref={ref} id={id} className={cn('select', error && 'input-error', className)} {...props}>
        {children ||
          options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
      </select>
      {error ? (
        <p className="field-error">
          <FiAlertCircle className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.8rem] text-cocoa-300">{hint}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
