import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Sheet from '../../components/ui/Sheet.jsx'

const canShare = () => typeof navigator.share === 'function'

// Shows a freshly created invite code with a share (or copy) button.
export default function InviteSheet({ code, onClose }) {
  const [copied, setCopied] = useState(false)
  const message = `Join me on Ditto, so we can go to talks and workshops together! My invite code: ${code} ${window.location.origin}`

  async function share() {
    try {
      if (canShare()) {
        await navigator.share({ text: message })
        return
      }
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Share sheet dismissed or clipboard blocked: the code is on screen anyway.
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Your invite code"
      subtitle="It works once. You'll be connected automatically when she joins."
      footer={
        <Button full size="lg" icon={copied ? Check : canShare() ? Share2 : Copy} onClick={share}>
          {copied ? 'Copied' : canShare() ? 'Share code' : 'Copy code'}
        </Button>
      }
    >
      <p className="rounded-3xl border-2 border-dashed border-ink py-6 text-center font-mono text-3xl font-bold tracking-widest select-all">
        {code}
      </p>
      <p className="mt-4 text-muted">
        Only vouch for women you know and trust. Everyone she meets here will see that you vouched for her.
      </p>
    </Sheet>
  )
}
