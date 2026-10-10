import { Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Header from '../../components/ui/Header.jsx'
import Input from '../../components/ui/Input.jsx'
import { AREAS, EVENT_FORMATS, INTERESTS } from '../../lib/constants.js'
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

const LEGEND = 'mb-2 font-display text-sm font-bold tracking-[0.12em] uppercase'

function validate(form) {
  const errors = {}
  if (form.title.trim().length < 3) errors.title = 'Give your event a title.'
  if (!form.description.trim()) errors.description = 'Add a short description so others know what to expect.'
  if (!form.tags.length) errors.tags = 'Pick at least one topic.'
  if (!form.format) errors.format = 'Pick what kind of event it is.'
  if (!form.date || !form.time) errors.when = 'Choose a date and start time.'
  else if (new Date(`${form.date}T${form.time}`) <= new Date()) errors.when = 'The event has to be in the future.'
  else if (form.endTime && form.endTime <= form.time) errors.when = 'The end time has to be after the start.'
  if (!form.area) errors.area = 'Choose the neighbourhood.'
  if (normalizeUrl(form.url) === null) errors.url = "That doesn't look like a web address."
  return errors
}

export default function NewEventPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: [],
    format: '',
    date: '',
    time: '',
    endTime: '',
    area: '',
    venue: '',
    url: '',
  })
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
          format: form.format,
          starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
          ends_at: form.endTime ? new Date(`${form.date}T${form.endTime}`).toISOString() : null,
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
      <Header back="/events" />

      <h1 className="mb-2 font-display text-4xl leading-tight font-extrabold tracking-tight">Publish an event</h1>
      <p className="mb-6 text-lg text-muted">
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
          <legend className={LEGEND}>Topics</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((tag) => (
              <Chip key={tag} selected={form.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                {tag}
              </Chip>
            ))}
          </div>
          {errors.tags && <p className="text-sm font-bold text-primary">{errors.tags}</p>}
        </fieldset>

        <fieldset className="flex flex-col gap-2" data-error={errors.format ? '' : undefined}>
          <legend className={LEGEND}>Kind of event</legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_FORMATS.map((f) => (
              <Chip key={f} selected={form.format === f} onClick={() => setForm((x) => ({ ...x, format: f }))}>
                {f}
              </Chip>
            ))}
          </div>
          {errors.format && <p className="text-sm font-bold text-primary">{errors.format}</p>}
        </fieldset>

        <div className="flex flex-col gap-1.5" data-error={errors.when ? '' : undefined}>
          <Input label="Date" type="date" min={todayKey()} value={form.date} onChange={set('date')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts" type="time" value={form.time} onChange={set('time')} />
            <Input label="Ends (optional)" type="time" value={form.endTime} onChange={set('endTime')} />
          </div>
          {errors.when && <p className="text-sm font-bold text-primary">{errors.when}</p>}
        </div>

        <fieldset className="flex flex-col gap-2" data-error={errors.area ? '' : undefined}>
          <legend className={LEGEND}>Neighbourhood</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <Chip key={a.name} selected={form.area === a.name} onClick={() => setForm((f) => ({ ...f, area: a.name }))}>
                {a.name}
              </Chip>
            ))}
          </div>
          {errors.area && <p className="text-sm font-bold text-primary">{errors.area}</p>}
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
          <p role="alert" className="text-center text-sm font-bold text-primary">
            {submitError}
          </p>
        )}
        <Button full size="lg" type="submit" icon={submitting ? undefined : Send} loading={submitting}>
          {submitting ? 'Publishing…' : 'Publish event'}
        </Button>
      </div>
    </form>
  )
}
