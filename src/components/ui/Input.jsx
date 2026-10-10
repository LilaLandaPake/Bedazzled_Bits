import { useId } from 'react'

// Labelled text field. `multiline` renders a textarea. `error` replaces the hint and
// turns the border pink.
export default function Input({ label, hint, error, multiline = false, className = '', ...rest }) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint
  const Field = multiline ? 'textarea' : 'input'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
      )}
      <Field
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={note ? noteId : undefined}
        className={`rounded-2xl bg-card px-4 text-base text-text-main ring-1 transition outline-none [color-scheme:dark] placeholder:text-text-main/40 focus:ring-2 ${
          multiline ? 'min-h-28 resize-y py-3' : 'h-12'
        } ${error ? 'ring-primary' : 'ring-white/10 focus:ring-accent-purple'}`}
        {...rest}
      />
      {note && (
        <p id={noteId} className={`text-sm ${error ? 'text-primary' : 'text-text-main/60'}`}>
          {note}
        </p>
      )}
    </div>
  )
}
