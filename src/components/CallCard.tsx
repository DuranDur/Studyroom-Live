/**
 * CallCard -- shared "Start call / Join call" button for the study room.
 *
 * One record per call lives in the `calls` collection. Starting a call creates
 * a record with status "live"; ending it sets status to "ended". Everyone
 * subscribed to the collection sees the button flip between Start and Join
 * in real time, so a late joiner lands in the same meeting.
 *
 * The meeting itself is an external link (MEET_URL in constants.ts). This
 * component does not do audio or video.
 */

import { useState } from 'react'
import { useUser, useQuery, useMutations, isWriterRole } from 'deepspace'
import { MEET_URL } from '../constants'

// A call still marked "live" after this long is treated as ended, so a
// forgotten call does not stay live forever.
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

interface CallData {
  status: 'live' | 'ended'
  startedByName?: string
  startedAt?: string
  startedById: string
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function CallCard() {
  const { user } = useUser()
  const { records, status } = useQuery('calls', { where: { status: 'live' } })
  const { create, put } = useMutations('calls')
  const [error, setError] = useState<string | null>(null)

  const canStart = isWriterRole(user?.role)

  // Newest live call that is not stale.
  const liveCall = records
    .map((r) => ({ id: r.recordId, ...(r.data as unknown as CallData) }))
    .filter((c) => {
      const started = c.startedAt ? new Date(c.startedAt).getTime() : 0
      return Date.now() - started < STALE_AFTER_MS
    })
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0]

  const canEnd = !!liveCall && !!user && (liveCall.startedById === user.id || user.role === 'admin')

  const openMeeting = () => {
    window.open(MEET_URL, '_blank', 'noopener,noreferrer')
  }

  const handleStart = async () => {
    setError(null)
    // Open the meeting first, inside the click, so the browser does not
    // block it as a popup.
    openMeeting()
    try {
      await create({
        status: 'live',
        startedByName: user?.name ?? user?.email ?? 'Someone',
        startedAt: new Date().toISOString(),
      })
    } catch {
      setError('Could not mark the call as live. The meeting link still opened.')
    }
  }

  const handleEnd = async () => {
    if (!liveCall) return
    setError(null)
    try {
      await put(liveCall.id, { status: 'ended' })
    } catch {
      setError('Could not end the call.')
    }
  }

  const buttonClass =
    'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50'
  const secondaryClass =
    'rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted'

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-left" data-testid="call-card">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${liveCall ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
          aria-hidden
        />
        <h2 className="text-base font-semibold">Study call</h2>
      </div>

      {status !== 'ready' ? (
        <p className="text-sm text-muted-foreground">Checking for a live call...</p>
      ) : liveCall ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground" data-testid="call-live-text">
            Live now. Started by {liveCall.startedByName ?? 'someone'}
            {liveCall.startedAt ? ` at ${formatTime(liveCall.startedAt)}` : ''}.
          </p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass} onClick={openMeeting} data-testid="call-join">
              Join call
            </button>
            {canEnd ? (
              <button type="button" className={secondaryClass} onClick={handleEnd} data-testid="call-end">
                End call
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            No call right now. Start one and everyone in the room will see a Join button.
          </p>
          <button
            type="button"
            className={buttonClass}
            onClick={handleStart}
            disabled={!canStart}
            data-testid="call-start"
          >
            Start call
          </button>
          {!canStart ? (
            <p className="mt-2 text-xs text-muted-foreground">Members can start calls.</p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="mt-3 text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
