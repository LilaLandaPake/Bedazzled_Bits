import { Check, MapPin, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import Input from '../../components/ui/Input.jsx'
import { AREAS, INTERESTS } from '../../lib/constants.js'
import { createEvent } from '../../lib/db.js'
import { getCurrentUser } from '../../lib/session.js'

// "eventbrite.com/x" -> "https://eventbrite.com/x". Returns null if it isn't a web address.
function normalizeUrl(raw) {
  const value = raw.trim()
  if (!value) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return url.hostname.includes('.') ? url.href : null
  } catch {
    return null
  }
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function validate(form) {
  const errors = {}
  if (form.title.trim().length < 3) errors.title = 'Give your event a title.'
  if (!form.description.trim()) errors.description = 'Add a short description so others know what to expect.'
  if (!form.tags.length) errors.tags = 'Pick at least one topic.'
  if (!form.date || !form.time) errors.when = 'Choose a date and time.'
  else if (new Date(`${form.date}T${form.time}`) <= new Date()) errors.when = 'The event has to be in the future.'
  if (!form.area) errors.area = 'Choose the neighbourhood.'
  if (normalizeUrl(form.url) === null) errors.url = "That doesn't look like a web address."
  return errors
}

export default function NewEventPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', tags: [], date: '', time: '', area: '', venue: '', url: '' })
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const errors = touched ? validate(form) : {}
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function toggleTag(tag) {
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    const found = validate(form)
    if (Object.keys(found).length) {
      // Bring the first problem into view on small screens.
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [data-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const event = await createEvent(
        {
          title: form.title,
          description: form.description,
          tags: form.tags,
          starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
          area: form.area,
          venue: form.venue,
          url: normalizeUrl(form.url),
        },
        getCurrentUser(),
      )
      navigate(`/events/${event.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col">
      <Header title="Publish an event" back="/events" />

      <p className="mb-6 text-text-main/75">
        Share a meetup idea or an external talk or workshop you'd like company for. You'll be signed up
        automatically.
      </p>

      <div className="flex flex-col gap-5">
        <Input
          label="Title"
          placeholder="e.g. Intro to Figma workshop"
          value={form.title}
          onChange={set('title')}
          error={errors.title}
          maxLength={100}
        />

        <Input
          label="Description"
          multiline
          placeholder="What is it, and what kind of company are you looking for?"
          value={form.description}
          onChange={set('description')}
          error={errors.description}
          maxLength={1000}
        />

        <fieldset className="flex flex-col gap-2" data-error={errors.tags ? '' : undefined}>
          <legend className="mb-2 text-sm font-semibold">Topics</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((tag) => (
              <Chip
                key={tag}
                selected={form.tags.includes(tag)}
                icon={form.tags.includes(tag) ? Check : undefined}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
          {errors.tags && <p className="text-sm text-primary">{errors.tags}</p>}
        </fieldset>

        <div className="flex flex-col gap-1.5" data-error={errors.when ? '' : undefined}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" min={todayKey()} value={form.date} onChange={set('date')} />
            <Input label="Time" type="time" value={form.time} onChange={set('time')} />
          </div>
          {errors.when && <p className="text-sm text-primary">{errors.when}</p>}
        </div>

        <fieldset className="flex flex-col gap-2" data-error={errors.area ? '' : undefined}>
          <legend className="mb-2 text-sm font-semibold">Neighbourhood</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Chip
                key={a.name}
                tone="pink"
                icon={MapPin}
                selected={form.area === a.name}
                onClick={() => setForm((f) => ({ ...f, area: a.name }))}
              >
                {a.name}
              </Chip>
            ))}
          </div>
          {errors.area && <p className="text-sm text-primary">{errors.area}</p>}
        </fieldset>

        <Input
          label="Place (optional)"
          placeholder="e.g. Biblioteca Jaume Fuster"
          hint="Meet in public places only."
          value={form.venue}
          onChange={set('venue')}
          maxLength={100}
        />

        <Input
          label="Event link (optional)"
          type="url"
          inputMode="url"
          placeholder="e.g. eventbrite.com/your-event"
          value={form.url}
          onChange={set('url')}
          error={errors.url}
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {submitError && (
          <p role="alert" className="text-center text-sm text-primary">
            {submitError}
          </p>
        )}
        <Button full type="submit" icon={submitting ? undefined : Send} loading={submitting}>
          {submitting ? 'Publishing…' : 'Publish event'}
        </Button>
      </div>
    </form>
  )
}
