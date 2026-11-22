/**
 * Home -- the study room's front door: who you are, the shared call card,
 * and quick links to the room's tools.
 */

import { useAuthProfileReady } from 'deepspace'
import { APP_NAME } from '../../constants'
import CallCard from '../../components/CallCard'

const LINKS = [
  { href: '/chat', title: 'Chat', blurb: 'Talk with everyone in the room.' },
  { href: '/documents', title: 'Shared notes', blurb: 'Co-edit notes in real time.' },
  { href: '/items', title: 'Study tasks', blurb: 'A shared to-do list for the group.' },
  { href: '/assistant', title: 'AI assistant', blurb: 'Your private study helper.' },
  { href: '/file-manager', title: 'My files', blurb: 'Your personal file storage. Other members can\'t see your files.' },
]

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 bg-background px-6 py-10 text-foreground">
      <header>
        <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A shared study room: chat, notes, tasks, and a call link in one place.
          {isSignedIn && user ? ` Signed in as ${user.name ?? user.email}.` : ''}
        </p>
      </header>

      <CallCard />

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Room tools">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <p className="font-medium">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.blurb}</p>
          </a>
        ))}
      </nav>
    </div>
  )
}
