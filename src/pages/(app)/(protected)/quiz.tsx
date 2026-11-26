import { useRef, useState } from 'react'
import { useUser, useQuery, useMutations } from 'deepspace'

interface QuestionData {
  question: string
  choiceA: string
  choiceB: string
  choiceC: string
  choiceD: string
  correct: string
  topic?: string
  createdByName?: string
  createdById: string
}

interface AttemptData {
  playerName?: string
  score: number
  total: number
  playedAt?: string
  playerId: string
}

interface RecordRow<T> {
  recordId: string
  createdAt: string
  data: T
}

const LETTERS = ['A', 'B', 'C', 'D'] as const

function choiceText(q: QuestionData, letter: string): string {
  if (letter === 'A') return q.choiceA
  if (letter === 'B') return q.choiceB
  if (letter === 'C') return q.choiceC
  return q.choiceD
}

// Stars for a run: 90%+ is 5 stars, then one star less per step down.
function starsFor(score: number, total: number): number {
  if (total <= 0) return 0
  const pct = score / total
  if (pct >= 0.9) return 5
  if (pct >= 0.75) return 4
  if (pct >= 0.6) return 3
  if (pct >= 0.4) return 2
  if (pct > 0) return 1
  return 0
}

function starText(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export default function QuizPage() {
  const { user } = useUser()
  const { records: questionRecords, status: questionsStatus } =
    useQuery('quiz-questions')
  const { records: attemptRecords } = useQuery('quiz-attempts')
  const { create: createQuestion } = useMutations('quiz-questions')
  const { create: createAttempt } = useMutations('quiz-attempts')

  const questions = (questionRecords ?? []) as RecordRow<QuestionData>[]
  const attempts = [...((attemptRecords ?? []) as RecordRow<AttemptData>[])].sort(
    (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  )

  // Leaderboard: one row per player, ranked by their best run.
  const bestByPlayer = new Map<
    string,
    { name: string; score: number; total: number; games: number }
  >()
  for (const a of attempts) {
    const key = a.data.playerId || a.data.playerName || 'Someone'
    const pct = a.data.total > 0 ? a.data.score / a.data.total : 0
    const row = bestByPlayer.get(key)
    if (!row) {
      bestByPlayer.set(key, {
        name: a.data.playerName ?? 'Someone',
        score: a.data.score,
        total: a.data.total,
        games: 1,
      })
    } else {
      row.games += 1
      const bestPct = row.total > 0 ? row.score / row.total : 0
      if (pct > bestPct) {
        row.score = a.data.score
        row.total = a.data.total
        row.name = a.data.playerName ?? row.name
      }
    }
  }
  const leaderboard = [...bestByPlayer.values()].sort((x, y) => {
    const px = x.total > 0 ? x.score / x.total : 0
    const py = y.total > 0 ? y.score / y.total : 0
    return py - px || y.total - x.total || y.games - x.games
  })

  const displayName = user?.name ?? user?.email ?? 'Someone'

  const [mode, setMode] = useState<'home' | 'taking' | 'adding' | 'done'>('home')
  const [order, setOrder] = useState<RecordRow<QuestionData>[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const savedRef = useRef(false)

  // Add-question form
  const [fQuestion, setFQuestion] = useState('')
  const [fA, setFA] = useState('')
  const [fB, setFB] = useState('')
  const [fC, setFC] = useState('')
  const [fD, setFD] = useState('')
  const [fCorrect, setFCorrect] = useState('A')
  const [fTopic, setFTopic] = useState('')

  function startQuiz() {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setIndex(0)
    setPicked(null)
    setScore(0)
    setError(null)
    setSaveFailed(false)
    savedRef.current = false
    setMode('taking')
  }

  function handlePick(letter: string) {
    if (picked) return
    setPicked(letter)
    if (letter === order[index].data.correct) setScore((s) => s + 1)
  }

  async function handleNext() {
    if (index + 1 < order.length) {
      setIndex(index + 1)
      setPicked(null)
      return
    }
    setMode('done')
    if (!savedRef.current) {
      savedRef.current = true
      try {
        await createAttempt({
          playerName: displayName,
          score,
          total: order.length,
          playedAt: new Date().toISOString(),
        })
      } catch {
        setSaveFailed(true)
      }
    }
  }

  async function handleAdd() {
    if (!fQuestion.trim() || !fA.trim() || !fB.trim() || !fC.trim() || !fD.trim()) {
      setError('Fill in the question and all four choices.')
      return
    }
    try {
      await createQuestion({
        question: fQuestion.trim(),
        choiceA: fA.trim(),
        choiceB: fB.trim(),
        choiceC: fC.trim(),
        choiceD: fD.trim(),
        correct: fCorrect,
        topic: fTopic.trim(),
        createdByName: displayName,
      })
      setFQuestion('')
      setFA('')
      setFB('')
      setFC('')
      setFD('')
      setFCorrect('A')
      setFTopic('')
      setError(null)
      setMode('home')
    } catch {
      setError('Could not save the question. Try again.')
    }
  }

  const inputClass =
    'w-full rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-8 text-foreground">
      <h1 className="text-2xl font-semibold">Quiz</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {mode === 'home' && (
        <>
          <p className="text-sm text-muted-foreground">
            {questionsStatus !== 'ready'
              ? 'Loading questions...'
              : questions.length === 0
                ? 'No questions yet. Add the first one and the room can start quizzing.'
                : `${questions.length} question${questions.length === 1 ? '' : 's'} in the bank. Questions shuffle every run.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startQuiz}
              disabled={questions.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Start quiz
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setMode('adding')
              }}
              className="rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium"
            >
              Add question
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody has finished a quiz yet.
              </p>
            ) : (
              leaderboard.slice(0, 10).map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 px-3 py-2 text-sm"
                >
                  <span>
                    {i + 1}. {row.name}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="text-amber-500">
                      {starText(starsFor(row.score, row.total))}
                    </span>{' '}
                    best {row.score} / {row.total} · {row.games} game
                    {row.games === 1 ? '' : 's'}
                  </span>
                </div>
              ))
            )}
          </div>

          {attempts.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <h2 className="text-sm font-semibold">Recent scores</h2>
              {attempts.slice(0, 10).map((a) => (
                <div
                  key={a.recordId}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 px-3 py-2 text-sm"
                >
                  <span>{a.data.playerName ?? 'Someone'}</span>
                  <span className="text-muted-foreground">
                    <span className="text-amber-500">
                      {starText(starsFor(a.data.score, a.data.total))}
                    </span>{' '}
                    {a.data.score} / {a.data.total}
                    {a.data.playedAt
                      ? ` · ${new Date(a.data.playedAt).toLocaleDateString()}`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'taking' && order.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {order.length}
            {order[index].data.topic ? ` · ${order[index].data.topic}` : ''}
          </p>
          <p className="text-lg font-medium">{order[index].data.question}</p>
          <div className="flex flex-col gap-2">
            {LETTERS.map((letter) => {
              const isCorrect = order[index].data.correct === letter
              const isPicked = picked === letter
              let cls = 'hover:bg-foreground/5'
              if (picked && isCorrect) cls = 'border border-green-500 bg-green-500/10'
              else if (picked && isPicked) cls = 'border border-red-500 bg-red-500/10'
              else if (picked) cls = 'opacity-60'
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handlePick(letter)}
                  className={`w-full rounded-lg bg-foreground/5 px-3 py-2 text-left text-sm ${cls}`}
                >
                  <span className="font-semibold">{letter}.</span>{' '}
                  {choiceText(order[index].data, letter)}
                </button>
              )
            })}
          </div>
          {picked && (
            <>
              <p className="text-sm">
                {picked === order[index].data.correct
                  ? 'Correct.'
                  : `Not quite — the answer is ${order[index].data.correct}.`}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {index + 1 < order.length ? 'Next question' : 'See score'}
              </button>
            </>
          )}
        </>
      )}

      {mode === 'done' && (
        <>
          <p className="text-lg font-medium">
            You scored {score} / {order.length}
          </p>
          <p className="text-lg text-amber-500">
            {starText(starsFor(score, order.length))}
          </p>
          {saveFailed ? (
            <p className="text-sm text-red-500">
              Couldn't save your score — it won't show on the leaderboard.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your result is on the leaderboard for the room to see.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startQuiz}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Take it again
            </button>
            <button
              type="button"
              onClick={() => setMode('home')}
              className="rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium"
            >
              Back
            </button>
          </div>
        </>
      )}

      {mode === 'adding' && (
        <>
          <div className="flex flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Question"
              value={fQuestion}
              onChange={(e) => setFQuestion(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Choice A"
              value={fA}
              onChange={(e) => setFA(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Choice B"
              value={fB}
              onChange={(e) => setFB(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Choice C"
              value={fC}
              onChange={(e) => setFC(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Choice D"
              value={fD}
              onChange={(e) => setFD(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Topic (optional, e.g. Linear Algebra)"
              value={fTopic}
              onChange={(e) => setFTopic(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              Correct answer
              <select
                className="rounded-lg bg-foreground/5 px-2 py-2 text-sm"
                value={fCorrect}
                onChange={(e) => setFCorrect(e.target.value)}
              >
                {LETTERS.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Save question
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setMode('home')
              }}
              className="rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
