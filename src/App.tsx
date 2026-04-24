import { useEffect, useMemo, useState } from 'react'
import Button from './components/Button'
import Card from './components/Card'
import CodeBlock from './components/CodeBlock'
import { questions, type Question } from './data/questions'
import { createLocalHint, gradeWithOpenAI, type GradingResult } from './lib/grading'
import { formatCodeSnippet, getPdfHref, isCodeQuestion } from './lib/utils'

type ResultMap = Record<string, GradingResult>
type AnswerMap = Record<string, string>
type DateMap = Record<string, string>

const modelOptions = [
  'gpt-4.1-mini',
  'gpt-4.1',
  'gpt-4o-mini',
  'gpt-4o',
]

const storageKeys = {
  apiKey: 'iot-cbt-api-key',
  answers: 'iot-cbt-answers',
  results: 'iot-cbt-results',
  lastEvaluatedAt: 'iot-cbt-last-evaluated-at',
}

function readStoredString(key: string) {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function readStoredJson<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStoredString(key: string, value: string) {
  if (typeof window === 'undefined') return

  try {
    if (value) {
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage errors silently.
  }
}

function writeStoredJson(key: string, value: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  try {
    if (Object.keys(value).length > 0) {
      window.localStorage.setItem(key, JSON.stringify(value))
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage errors silently.
  }
}

function App() {
  const [apiKey, setApiKey] = useState(() => readStoredString(storageKeys.apiKey))
  const [model, setModel] = useState('gpt-4.1-mini')
  const [started, setStarted] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    readStoredJson<AnswerMap>(storageKeys.answers, {}),
  )
  const [results, setResults] = useState<ResultMap>(() =>
    readStoredJson<ResultMap>(storageKeys.results, {}),
  )
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<DateMap>(() =>
    readStoredJson<DateMap>(storageKeys.lastEvaluatedAt, {}),
  )
  const [hint, setHint] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState('')

  const currentQuestion = questions[currentIndex]
  const answer = answers[currentQuestion.id] ?? ''
  const result = results[currentQuestion.id]
  const isCurrentCodeQuestion = isCodeQuestion(currentQuestion)
  const progress = `${currentIndex + 1} / ${questions.length}`
  const scoreAverage = useMemo(() => {
    const values = Object.values(results)
    if (values.length === 0) return 0
    return Math.round(values.reduce((sum, item) => sum + item.score, 0) / values.length)
  }, [results])

  useEffect(() => {
    writeStoredString(storageKeys.apiKey, apiKey)
  }, [apiKey])

  useEffect(() => {
    writeStoredJson(storageKeys.answers, answers)
  }, [answers])

  useEffect(() => {
    writeStoredJson(storageKeys.results, results)
  }, [results])

  useEffect(() => {
    writeStoredJson(storageKeys.lastEvaluatedAt, lastEvaluatedAt)
  }, [lastEvaluatedAt])

  const handleGrade = async () => {
    if (!apiKey.trim()) {
      setError('AI 채점을 받으려면 OpenAI API key를 입력해 주세요.')
      return
    }

    try {
      setIsGrading(true)
      setError('')
      const nextResult = await gradeWithOpenAI({
        apiKey: apiKey.trim(),
        answer,
        model: model.trim() || 'gpt-4.1-mini',
        question: currentQuestion,
      })
      setResults((current) => ({ ...current, [currentQuestion.id]: nextResult }))
      setLastEvaluatedAt((current) => ({
        ...current,
        [currentQuestion.id]: new Date().toISOString(),
      }))
    } catch {
      setError('AI 채점 요청에 실패했습니다. API key와 모델명을 확인해 주세요.')
    } finally {
      setIsGrading(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    setHint('')
    setShowAnswer(false)
    setError('')
  }

  const resetQuestion = (questionId: string) => {
    setAnswers((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })
    setResults((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })
    setLastEvaluatedAt((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })
    setHint('')
    setShowAnswer(false)
    setError('')
  }

  const maskedApiKey = apiKey.trim()
    ? apiKey.trim().replace(/^(.{6}).*(.{4})$/, '$1••••••$2')
    : '미설정'

  const goToRandomQuestion = () => {
    if (questions.length <= 1) return

    let nextIndex = currentIndex
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * questions.length)
    }
    goToQuestion(nextIndex)
    resetQuestion(questions[nextIndex].id)
  }

  const resetAll = () => {
    setAnswers({})
    setResults({})
    setLastEvaluatedAt({})
    setHint('')
    setShowAnswer(false)
    setError('')
    setCurrentIndex(0)
  }

  if (!started) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-10">
        <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:items-center">
          <section className="rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-card sm:px-9 sm:py-10">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
              <span>러닝메이트</span>
              <span className="text-slate-300">/</span>
              <span>양희승</span>
              <span className="text-slate-300">/</span>
              <span>IoT 강의</span>
            </div>
            <div className="mt-12 max-w-2xl">
              <p className="text-sm font-semibold text-blue-700">
                혼자 푸는 CBT 연습
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                중간고사 기출형 문제를 풀고 바로 채점합니다
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                실시간 강의 프로젝트의 문제를 그대로 사용하되, 손코딩 문제는 뒤쪽에 배치했습니다.
                API key를 입력하면 AI 채점을 받을 수 있고, key 없이 시작하면 모범답안으로 자가 점검할 수 있습니다.
              </p>
            </div>
          </section>

          <Card className="self-center p-7 sm:p-8">
            <p className="text-sm font-semibold text-slate-500">CBT 시작</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              OpenAI API key 입력
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              입력한 key는 이 브라우저에서 AI 채점 요청에만 사용합니다. key 없이 시작하면 AI 채점 대신 모범답안 보기를 사용할 수 있습니다.
            </p>
            <div className="mt-6 space-y-4">
              <TextInput
                label="OpenAI API key"
                onChange={setApiKey}
                placeholder="sk-..."
                type="password"
                value={apiKey}
              />
              <TextInput
                label="모델"
                onChange={setModel}
                placeholder="gpt-4.1-mini"
                value={model}
              />
              <Button fullWidth onClick={() => setStarted(true)}>
                CBT 시작
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-100 px-4 pb-4 pt-0 sm:px-6 lg:px-10">
      <div className="mx-auto flex h-full max-w-[1880px] flex-col gap-5">
        <header className="sticky top-0 z-50 shrink-0 rounded-b-[28px] border border-t-0 border-slate-200/80 bg-white px-5 py-4 shadow-card sm:px-6 lg:px-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.7fr)_minmax(560px,1fr)] xl:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-600 sm:text-sm">
                AI Exam Prep
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-normal text-slate-950 sm:text-3xl lg:text-4xl">
                서술형 답안 작성 및 AI 채점
              </h1>
              <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
                현재 API Key:{' '}
                <span className="font-bold text-slate-700">{maskedApiKey}</span>
              </p>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                <Button
                  className="h-10 rounded-xl px-4 text-sm"
                  onClick={() => setShowApiSettings((current) => !current)}
                  variant="secondary"
                >
                  API Key 설정
                </Button>
                <Button
                  className="h-10 rounded-xl px-4 text-sm"
                  onClick={goToRandomQuestion}
                  variant="secondary"
                >
                  랜덤 문제
                </Button>
                <Button
                  className="h-10 rounded-xl bg-red-500 px-4 text-sm hover:bg-red-600"
                  onClick={resetAll}
                >
                  전체 초기화
                </Button>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                  <div className="shrink-0">
                    <p className="text-sm font-medium text-slate-500">
                      문제 바로가기
                    </p>
                    <h2 className="mt-0.5 text-sm font-bold tracking-normal text-slate-950 sm:text-base">
                      {currentIndex + 1}번 문제 선택됨
                    </h2>
                  </div>
                  <div className="min-w-0 overflow-x-auto pb-1 xl:order-2">
                    <div className="flex min-w-max gap-2">
                  {questions.map((question, index) => {
                    const isCurrent = index === currentIndex
                    const hasWork =
                      Boolean((answers[question.id] ?? '').trim()) ||
                      Boolean(results[question.id])

                    return (
                      <button
                        className={[
                          'flex h-11 min-w-[52px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition',
                          isCurrent
                            ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50',
                        ].join(' ')}
                        key={question.id}
                        onClick={() => goToQuestion(index)}
                        type="button"
                      >
                        <span>{index + 1}</span>
                        <span
                          className={[
                            'h-2.5 w-2.5 rounded-full',
                            hasWork ? 'bg-emerald-400' : 'bg-slate-200',
                          ].join(' ')}
                        />
                      </button>
                    )
                  })}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2 xl:order-3">
                    <Button
                      className="h-9 rounded-xl px-3 text-xs"
                      disabled={currentIndex === 0}
                      onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
                      variant="secondary"
                    >
                      이전 문제
                    </Button>
                    <Button
                      className="h-9 rounded-xl px-3 text-xs"
                      onClick={() => resetQuestion(currentQuestion.id)}
                      variant="secondary"
                    >
                      현재 문제 초기화
                    </Button>
                    <Button
                      className="h-9 rounded-xl px-3 text-xs"
                      disabled={currentIndex === questions.length - 1}
                      onClick={() =>
                        goToQuestion(Math.min(questions.length - 1, currentIndex + 1))
                      }
                    >
                      다음 문제
                    </Button>
                  </div>
                </div>
                <div className="hidden">
                  {questions.map((question, index) => {
                    const isCurrent = index === currentIndex
                    const hasWork =
                      Boolean((answers[question.id] ?? '').trim()) ||
                      Boolean(results[question.id])

                    return (
                      <button
                        className={[
                          'flex h-11 min-w-[52px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition',
                          isCurrent
                            ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50',
                        ].join(' ')}
                        key={question.id}
                        onClick={() => goToQuestion(index)}
                        type="button"
                      >
                        <span>{index + 1}</span>
                        <span
                          className={[
                            'h-2.5 w-2.5 rounded-full',
                            hasWork ? 'bg-emerald-400' : 'bg-slate-200',
                          ].join(' ')}
                        />
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>

          {showApiSettings ? (
            <ApiSettingsModal
              apiKey={apiKey}
              model={model}
              onApiKeyChange={setApiKey}
              onClose={() => setShowApiSettings(false)}
              onModelChange={setModel}
            />
          ) : null}
        </header>

        <section className="min-h-0 flex-1">
          {null}

          <div className="grid h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(520px,1.15fr)] xl:items-stretch">
            <AnswerEditorCard
              answer={answer}
              error={error}
              hint={hint}
              isCodeQuestion={isCurrentCodeQuestion}
              isGrading={isGrading}
              onAnswerChange={(value) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: value,
                }))
              }
              onGrade={handleGrade}
              question={currentQuestion}
            />
            <FeedbackPanelCard
              hint={createLocalHint(currentQuestion)}
              isLoading={isGrading}
              lastEvaluatedAt={lastEvaluatedAt[currentQuestion.id]}
              modelAnswer={currentQuestion.solutionCode || currentQuestion.expectedAnswer}
              pdfHref={getPdfHref(currentQuestion)}
              result={result}
              showModelAnswerButton
            />
          </div>

          <Card className="hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">답안 작성</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  내 답안
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setHint(createLocalHint(currentQuestion))}
                  variant="secondary"
                >
                  힌트보기
                </Button>
                {!apiKey.trim() ? (
                  <Button onClick={() => setShowAnswer(true)} variant="secondary">
                    모범답안보기
                  </Button>
                ) : null}
                <Button disabled={isGrading} onClick={handleGrade}>
                  {isGrading ? '채점 중...' : 'AI 채점받기'}
                </Button>
              </div>
            </div>

            {isCurrentCodeQuestion ? (
              <CodeEditorTextarea
                onChange={(value) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: value,
                  }))
                }
                value={answer}
              />
            ) : (
              <textarea
                className="mt-5 min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base leading-8 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: event.target.value,
                  }))
                }
                placeholder="답안을 입력하세요."
                value={answer}
              />
            )}

            {hint ? (
              <Notice title="힌트" tone="blue">
                {hint}
              </Notice>
            ) : null}

            {error ? (
              <Notice title="오류" tone="rose">
                {error}
              </Notice>
            ) : null}
          </Card>

          {showAnswer ? <ModelAnswer question={currentQuestion} /> : null}
          {null}

          <div className="hidden justify-between gap-3">
            <Button
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              variant="secondary"
            >
              이전 문제
            </Button>
            <Button
              disabled={currentIndex === questions.length - 1}
              onClick={() =>
                goToQuestion(Math.min(questions.length - 1, currentIndex + 1))
              }
            >
              다음 문제
            </Button>
          </div>
        </section>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <div>
              <p className="text-sm font-semibold text-slate-500">IoT CBT</p>
              <h1 className="mt-2 text-xl font-semibold text-slate-950">
                러닝메이트 IoT 강의
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                진행 {progress} · 평균 {scoreAverage}점
              </p>
            </div>
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <TextInput
                label="OpenAI API key"
                onChange={setApiKey}
                placeholder="sk-..."
                type="password"
                value={apiKey}
              />
              <TextInput
                label="Model"
                onChange={setModel}
                placeholder="gpt-4.1-mini"
                value={model}
              />
            </div>
            <div className="mt-5 space-y-2">
              {questions.map((question, index) => (
                <button
                  className={[
                    'w-full rounded-2xl px-4 py-3 text-left text-sm transition',
                    index === currentIndex
                      ? 'bg-blue-50 font-semibold text-blue-800'
                      : 'bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  type="button"
                >
                  <span>{index + 1}. </span>
                  <span>{question.title}</span>
                  {results[question.id] ? (
                    <span className="mt-1 block text-xs text-slate-400">
                      {results[question.id].score}점
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
          <QuestionCard question={currentQuestion} />

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">답안 작성</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  내 답안
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setHint(createLocalHint(currentQuestion))}
                  variant="secondary"
                >
                  힌트보기
                </Button>
                {!apiKey.trim() ? (
                  <Button onClick={() => setShowAnswer(true)} variant="secondary">
                    모범답안보기
                  </Button>
                ) : null}
                <Button disabled={isGrading} onClick={handleGrade}>
                  {isGrading ? '채점 중...' : 'AI 채점받기'}
                </Button>
              </div>
            </div>

            <textarea
              className={[
                'mt-5 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
                isCodeQuestion(currentQuestion)
                  ? 'min-h-[360px] font-mono text-sm leading-7'
                  : 'min-h-[220px] text-base leading-8',
              ].join(' ')}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: event.target.value,
                }))
              }
              placeholder="답안을 입력하세요."
              value={answer}
            />

            {hint ? (
              <Notice title="힌트" tone="blue">
                {hint}
              </Notice>
            ) : null}

            {error ? (
              <Notice title="오류" tone="rose">
                {error}
              </Notice>
            ) : null}
          </Card>

          {showAnswer ? <ModelAnswer question={currentQuestion} /> : null}
          {null}

          <div className="flex justify-between gap-3">
            <Button
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              variant="secondary"
            >
              이전 문제
            </Button>
            <Button
              disabled={currentIndex === questions.length - 1}
              onClick={() =>
                goToQuestion(Math.min(questions.length - 1, currentIndex + 1))
              }
            >
              다음 문제
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

function QuestionCard({ question }: { question: Question }) {
  const pdfHref = getPdfHref(question)

  return (
    <Card className="p-8 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">{question.topic}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {question.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {question.maxScore}점
          </span>
          {pdfHref ? (
            <a
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              href={pdfHref}
              rel="noreferrer"
              target="_blank"
            >
              PDF 참고
            </a>
          ) : null}
          {pdfHref ? (
            <a
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={pdfHref}
              rel="noreferrer"
              target="_blank"
            >
              PDF 참고하기
            </a>
          ) : null}
        </div>
      </div>
      <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">
        {question.description}
      </p>
      {question.imageUrl ? (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
          <img
            alt={`${question.title} 참고 이미지`}
            className="max-h-[420px] w-full object-contain"
            src={question.imageUrl}
          />
        </div>
      ) : null}
      {question.givenCode ? (
        <div className="mt-6">
          <CodeBlock code={question.givenCode} />
        </div>
      ) : null}
    </Card>
  )
}

function ModelAnswer({ question }: { question: Question }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-500">모범답안</p>
      {question.solutionCode ? (
        <div className="mt-4">
          <CodeBlock code={formatCodeSnippet(question.solutionCode)} />
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
          {question.expectedAnswer}
        </p>
      )}
    </Card>
  )
}

function AnswerEditorCard({
  answer,
  error,
  hint,
  isCodeQuestion,
  isGrading,
  onAnswerChange,
  onGrade,
  onShowAnswer = () => undefined,
  onShowHint = () => undefined,
  question,
}: {
  answer: string
  error: string
  hint: string
  isCodeQuestion: boolean
  isGrading: boolean
  onAnswerChange: (value: string) => void
  onGrade: () => void
  onShowAnswer?: () => void
  onShowHint?: () => void
  question: Question
}) {
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Answer</p>
          <h3 className="text-xl font-bold text-slate-950">답안 작성</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {false ? <Button onClick={onShowHint} variant="secondary">
            힌트 보기
          </Button> : null}
          {false ? (
            <Button onClick={onShowAnswer} variant="secondary">
              모범답안 보기
            </Button>
          ) : null}
          <Button disabled={isGrading} onClick={onGrade}>
            {isGrading ? '채점 중...' : 'AI 채점받기'}
          </Button>
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
      <CompactQuestionPanel question={question} />

      <div className="mt-4 min-h-0 flex-1">
        {isCodeQuestion ? (
          <CodeEditorTextarea onChange={onAnswerChange} value={answer} />
        ) : (
          <textarea
            className="min-h-[360px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 xl:h-full"
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="핵심 개념, 이유, 예시를 포함해서 서술형으로 작성해 보세요."
            value={answer}
          />
        )}
      </div>

      {hint ? (
        <Notice title="힌트" tone="blue">
          {hint}
        </Notice>
      ) : null}

      {error ? (
        <Notice title="오류" tone="rose">
          {error}
        </Notice>
      ) : null}
      </div>
    </Card>
  )
}

function CompactQuestionPanel({ question }: { question: Question }) {
  return (
    <section className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-700">{question.topic}</p>
          <h4 className="mt-1 text-base font-bold text-slate-950">
            {question.title}
          </h4>
        </div>
        <div className="flex shrink-0 gap-2">
          <span className="hidden rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
            {question.maxScore}점
          </span>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
        {question.description}
      </p>

      {question.imageUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img
            alt={`${question.title} 참고 이미지`}
            className="max-h-48 w-full object-contain"
            src={question.imageUrl}
          />
        </div>
      ) : null}

    </section>
  )
}

function FeedbackPanelCard({
  hint,
  isLoading,
  lastEvaluatedAt,
  modelAnswer,
  pdfHref,
  result,
  showModelAnswerButton,
}: {
  hint: string
  isLoading: boolean
  lastEvaluatedAt?: string
  modelAnswer: string
  pdfHref: string | null
  result?: GradingResult
  showModelAnswerButton: boolean
}) {
  const [isHintOpen, setIsHintOpen] = useState(false)
  const [isModelAnswerOpen, setIsModelAnswerOpen] = useState(false)

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">AI 채점 결과</p>
          <h3 className="text-xl font-bold text-slate-950">피드백 카드</h3>
          <p className="mt-1 text-xs text-slate-400">
            최근 채점 시각: {formatDateTime(lastEvaluatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button
          className="shrink-0"
          onClick={() => setIsHintOpen((current) => !current)}
          variant="secondary"
        >
          {isHintOpen ? '힌트 닫기' : '힌트 보기'}
        </Button>
          {showModelAnswerButton ? (
            <Button
              className="hidden"
              onClick={() => setIsModelAnswerOpen((current) => !current)}
              variant="secondary"
            >
              모범답안 보기
            </Button>
          ) : null}
          {showModelAnswerButton ? (
            <Button
              className="shrink-0"
              onClick={() => setIsModelAnswerOpen((current) => !current)}
              variant="secondary"
            >
              {isModelAnswerOpen ? '모범답안 닫기' : '모범답안 보기'}
            </Button>
          ) : null}
          {pdfHref ? (
            <a
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={pdfHref}
              rel="noreferrer"
              target="_blank"
            >
              PDF 참고하기
            </a>
          ) : null}
        </div>
      </div>

      <div
        className={[
          'shrink-0 overflow-hidden rounded-2xl bg-blue-50 transition-all duration-200',
          isHintOpen ? 'mt-4 max-h-40 opacity-100 ring-1 ring-blue-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-blue-900">답안 키워드 힌트</p>
          <p className="mt-2 text-sm leading-6 text-blue-800">{hint}</p>
        </div>
      </div>

      <div
        className={[
          'shrink-0 overflow-hidden rounded-2xl bg-slate-950 text-slate-50 transition-all duration-200',
          isModelAnswerOpen
            ? 'mt-4 max-h-[520px] opacity-100 ring-1 ring-slate-800'
            : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-white">모범답안</p>
          {looksLikeCode(modelAnswer) ? (
            <div className="mt-3">
              <CodeBlock code={formatCodeSnippet(modelAnswer)} />
            </div>
          ) : (
            <pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-6 text-slate-200">
              {modelAnswer}
            </pre>
          )}
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <FeedbackLoading />
        ) : !result ? (
          <FeedbackEmptyState />
        ) : (
          <div className="space-y-4">
            <div className="flex w-full justify-end">
            <div className="ml-auto inline-flex rounded-2xl bg-blue-50 px-4 py-3 text-blue-900 ring-1 ring-blue-100">
              <span className="text-sm font-medium">점수</span>
              <span className="ml-3 text-2xl font-bold">{result.score}</span>
              <span className="ml-1 self-end text-sm font-medium">/ 100</span>
            </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <h4 className="text-sm font-semibold text-slate-900">총평</h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {result.summary}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <FeedbackSection title="잘한 점" items={result.strengths} />
              <FeedbackSection title="부족한 점" items={result.weaknesses} />
            </div>

            <FeedbackSection title="보완 포인트" items={result.improvements} />

            <div className="rounded-2xl bg-slate-950 px-4 py-4 text-slate-50">
              <h4 className="text-sm font-semibold text-white">개선 예시 답안</h4>
              {looksLikeCode(result.rewrittenAnswer) ? (
                <div className="mt-3">
                  <CodeBlock code={formatCodeSnippet(result.rewrittenAnswer)} />
                </div>
              ) : (
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-200">
                  {result.rewrittenAnswer}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function FeedbackSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-1 text-sm leading-6 text-slate-600">
          {items.map((item, index) => (
            <li
              className="rounded-xl bg-slate-50 px-3 py-2"
              key={`${title}-${index}`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">표시할 내용이 없습니다.</p>
      )}
    </div>
  )
}

function FeedbackLoading() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

function FeedbackEmptyState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <div>
        <h4 className="text-base font-bold text-slate-900">
          아직 채점 결과가 없습니다
        </h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          답안을 제출하면 점수, 총평, 잘한 점, 부족한 점, 보완 포인트와 개선 예시 답안을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  )
}

function formatDateTime(value?: string) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function looksLikeCode(value: string) {
  return /(#include|void\s+\w+\s*\(|int\s+\w+|byte\s+\w+|Servo\s+\w+|digitalWrite|pinMode)/.test(
    value,
  )
}

function GradingResultCard({ result }: { result: GradingResult }) {
  return (
    <Card>
      <div>
        <p className="text-sm font-semibold text-slate-500">AI 채점 결과</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {result.score}점
        </h2>
      </div>
      <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">
        {result.feedback}
      </p>
      <ResultList title="감점 항목" items={result.weaknesses} tone="amber" />
      <ResultList title="보완 사항" items={result.improvements} tone="emerald" />
    </Card>
  )
}

function ResultList({
  items,
  title,
  tone,
}: {
  items: string[]
  title: string
  tone: 'amber' | 'emerald'
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-6">
      <p
        className={
          tone === 'amber'
            ? 'text-sm font-semibold text-amber-800'
            : 'text-sm font-semibold text-emerald-800'
        }
      >
        {title}
      </p>
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const codeStart = item.search(/(#include|void\s+\w+\s*\(|int\s+\w+|byte\s+\w+|Servo\s+\w+)/)
          if (codeStart >= 0) {
            const narrative = item.slice(0, codeStart).trim()
            const code = item.slice(codeStart).trim()
            return (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={item}
              >
                {narrative ? (
                  <p className="mb-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {narrative}
                  </p>
                ) : null}
                <CodeBlock code={code} />
              </div>
            )
          }

          return (
            <p
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700"
              key={item}
            >
              {item}
            </p>
          )
        })}
      </div>
    </section>
  )
}

function Notice({
  children,
  title,
  tone,
}: {
  children: string
  title: string
  tone: 'blue' | 'rose'
}) {
  return (
    <div
      className={[
        'mt-4 rounded-2xl border px-4 py-3 text-sm leading-7',
        tone === 'blue'
          ? 'border-blue-100 bg-blue-50 text-blue-900'
          : 'border-rose-100 bg-rose-50 text-rose-800',
      ].join(' ')}
    >
      <span className="font-semibold">{title}: </span>
      {children}
    </div>
  )
}

function ApiSettingsModal({
  apiKey,
  model,
  onApiKeyChange,
  onClose,
  onModelChange,
}: {
  apiKey: string
  model: string
  onApiKeyChange: (value: string) => void
  onClose: () => void
  onModelChange: (value: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">API Settings</p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
              API Key 설정
            </h2>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold leading-none text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <TextInput
            label="OpenAI API key"
            onChange={onApiKeyChange}
            placeholder="sk-..."
            type="password"
            value={apiKey}
          />
          <ModelSelect onChange={onModelChange} value={model} />
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            취소
          </Button>
          <Button onClick={onClose}>저장</Button>
        </div>
      </div>
    </div>
  )
}

function ModelSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        Model
      </span>
      <select
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {modelOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function CodeEditorTextarea({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) {
  const lineCount = Math.max(12, value.split('\n').length)

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-700 bg-[#020617] shadow-sm focus-within:ring-4 focus-within:ring-blue-100">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-medium text-slate-400">
            Arduino answer
          </span>
        </div>
      </div>
      <div className="grid min-h-[420px] grid-cols-[auto_minmax(0,1fr)]">
        <div className="select-none border-r border-white/10 bg-black/10 px-3 py-4 text-right font-mono text-xs leading-7 text-slate-500">
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          className="min-h-[420px] w-full resize-y border-0 bg-[#020617] px-4 py-4 font-mono text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"
          onChange={(event) => onChange(event.target.value)}
          placeholder={'// 답안을 코드로 작성하세요.\n\nvoid setup() {\n  \n}\n\nvoid loop() {\n  \n}'}
          spellCheck={false}
          value={value}
          wrap="off"
        />
      </div>
    </div>
  )
}

function TextInput({
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}

export default App
