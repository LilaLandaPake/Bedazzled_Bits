import { useId } from 'react'

// Labelled text field. `multiline` renders a textarea, `mono` uses the code font (invite
// codes). `error` replaces the hint and turns the border pink.
export default function Input({ label, hint, error, multiline = false, mono = false, className = '', ...rest }) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error || hint
  const Field = multiline ? 'textarea' : 'input'

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-display text-sm font-bold tracking-[0.12em] uppercase">
          {label}
        </label>
      )}
      <Field
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={note ? noteId : undefined}
        className={`w-full rounded-3xl border-2 bg-surface px-5 text-lg text-ink transition outline-none placeholder:text-muted/70 focus:border-primary ${
          multiline ? 'min-h-32 resize-y py-4' : 'h-14'
        } ${mono ? 'font-mono tracking-wider' : ''} ${error ? 'border-primary' : 'border-line'}`}
        {...rest}
      />
      {note && (
        <p id={noteId} className={`text-sm ${error ? 'font-bold text-primary' : 'text-muted'}`}>
          {note}
        </p>
      )}
    </div>
  )
}
