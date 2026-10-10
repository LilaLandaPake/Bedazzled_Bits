import { Send } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { REPORT_CATEGORIES } from '../../lib/constants.js'
import { reportUser } from '../../lib/db.js'

// Reason from the fixed list (required) plus optional details (required for "other").
export default function ReportForm({ reporterId, member, onDone }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const reasonError = touched && !reason ? 'Choose what happened.' : ''
  const detailsError = touched && reason === 'other' && !details.trim() ? 'Please describe what happened.' : ''

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (!reason || (reason === 'other' && !details.trim())) return
    setSending(true)
    setError('')
    try {
      await reportUser({ reporterId, reportedId: member.id, reason, details })
      onDone()
    } catch (err) {
      setError(err.message)
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-text-main/75">
        Your report is private. {member.name} won't know who sent it. If you're in danger, call 112.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">What happened?</legend>
        {REPORT_CATEGORIES.map((c) => (
          <label
            key={c.id}
            className={`flex cursor-pointer gap-3 rounded-2xl p-3 ring-1 transition ${
              reason === c.id ? 'bg-primary/10 ring-primary' : 'bg-card ring-white/5'
            }`}
          >
            <input
              type="radio"
              name="reason"
              value={c.id}
              checked={reason === c.id}
              onChange={() => setReason(c.id)}
              className="mt-1 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-medium">{c.label}</span>
              <span className="block text-sm text-text-main/60">{c.description}</span>
            </span>
          </label>
        ))}
        {reasonError && <p className="text-sm text-primary">{reasonError}</p>}
      </fieldset>

      <Input
        label={reason === 'other' ? 'Details' : 'Details (optional)'}
        multiline
        placeholder="Anything that helps us understand what happened"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        error={detailsError}
        maxLength={1000}
      />

      {error && (
        <p role="alert" className="text-center text-sm text-primary">
          {error}
        </p>
      )}
      <Button full type="submit" icon={sending ? undefined : Send} loading={sending}>
        {sending ? 'Sending…' : 'Send report'}
      </Button>
    </form>
  )
}
