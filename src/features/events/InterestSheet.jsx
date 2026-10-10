import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Chip from '../../components/ui/Chip.jsx'
import Sheet from '../../components/ui/Sheet.jsx'
import { INTERESTS } from '../../lib/constants.js'

// "Filter by interest" bottom sheet. Mount it only while open: the draft starts from
// `selected` and is applied with "Show events".
export default function InterestSheet({ selected, onApply, onClose }) {
  const [draft, setDraft] = useState(selected)

  function toggle(tag) {
    setDraft((list) => (list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]))
  }

  const n = draft.length

  return (
    <Sheet
      open
      onClose={onClose}
      title="Filter by interest"
      subtitle="Pick as many as you like."
      footer={
        <>
          <Button variant="link" size="lg" onClick={() => setDraft([])} disabled={n === 0}>
            Clear
          </Button>
          <Button size="lg" className="flex-1" onClick={() => onApply(draft)}>
            {n === 0 ? 'Show all events' : `Show events · ${n} ${n === 1 ? 'interest' : 'interests'}`}
          </Button>
        </>
      }
    >
      <div role="group" aria-label="Interests" className="flex flex-wrap gap-2.5">
        {INTERESTS.map((tag) => (
          <Chip key={tag} selected={draft.includes(tag)} onClick={() => toggle(tag)}>
            {tag}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}
