import type { Question } from '../data/questions'
import { clampScore, isCodeQuestion } from './utils'

export interface GradingResult {
  score: number
  summary: string
  feedback?: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  rewrittenAnswer: string
}

interface OpenAIResponse {
  output_text?: string
  output?: Array<{
    content?: Array<{
      text?: string
    }>
  }>
}

export async function gradeWithOpenAI({
  apiKey,
  answer,
  model,
  question,
}: {
  apiKey: string
  answer: string
  model: string
  question: Question
}): Promise<GradingResult> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: [
        'You are an automatic grader for an IoT and Arduino CBT practice app.',
        'Return JSON only. Write all feedback in Korean.',
        'Grade on a 0 to 100 scale.',
        'Use this exact feedback shape: score, summary, strengths, weaknesses, improvements, rewrittenAnswer.',
        'summary is the overall evaluation. strengths, weaknesses, and improvements are short string arrays.',
        'rewrittenAnswer is an improved model answer close to a full-credit answer.',
        'If this is a code question, rewrittenAnswer must include the complete corrected Arduino code.',
      ].join(' '),
      input: [
        `문제 제목: ${question.title}`,
        `문제 유형: ${question.questionType}`,
        `문제 설명: ${question.description}`,
        `제공 코드: ${question.givenCode ?? '없음'}`,
        `정답 코드: ${question.solutionCode ?? '없음'}`,
        `기대 답안: ${question.expectedAnswer}`,
        `채점 기준: ${question.rubric}`,
        `학생 답안: ${answer || '(빈 답안)'}`,
      ].join('\n'),
      text: {
        format: {
          type: 'json_schema',
          name: 'cbt_grading_result',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'score',
              'summary',
              'strengths',
              'weaknesses',
              'improvements',
              'rewrittenAnswer',
            ],
            properties: {
              score: { type: 'number' },
              summary: { type: 'string' },
              strengths: {
                type: 'array',
                items: { type: 'string' },
              },
              weaknesses: {
                type: 'array',
                items: { type: 'string' },
              },
              improvements: {
                type: 'array',
                items: { type: 'string' },
              },
              rewrittenAnswer: { type: 'string' },
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `OpenAI request failed: ${response.status}`)
  }

  const data = (await response.json()) as OpenAIResponse
  const parsed = JSON.parse(extractResponseText(data) || '{}') as GradingResult

  return ensureModelAnswer(question, {
    score: clampScore(parsed.score),
    summary: parsed.summary || parsed.feedback || '채점 결과를 생성하지 못했습니다.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    feedback: parsed.feedback || '채점 결과를 생성하지 못했습니다.',
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    rewrittenAnswer:
      typeof parsed.rewrittenAnswer === 'string'
        ? parsed.rewrittenAnswer
        : question.solutionCode || question.expectedAnswer,
  })
}

function extractResponseText(data: OpenAIResponse) {
  if (data.output_text) {
    return data.output_text
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join('\n') ?? ''
  )
}

function ensureModelAnswer(question: Question, result: GradingResult) {
  if (!isCodeQuestion(question) || !question.solutionCode) {
    return result
  }

  const alreadyIncluded =
    result.rewrittenAnswer.includes(question.solutionCode.slice(0, 80)) ||
    result.improvements.some((item) => item.includes(question.solutionCode!.slice(0, 80)))

  if (alreadyIncluded) {
    return result
  }

  return {
    ...result,
    improvements: [
      ...result.improvements,
      `모범 답안 코드는 다음과 같습니다.\n${question.solutionCode}`,
    ],
  }
}

export function createLocalHint(question: Question) {
  if (question.id === 'midterm-q4') {
    return '금색 띠는 보통 허용 오차를 뜻하므로 마지막에 읽습니다. 앞의 세 색띠로 숫자와 승수를 먼저 계산하세요.'
  }

  if (isCodeQuestion(question)) {
    return '문제 조건을 setup(), loop(), 전역 변수/배열, 보조 함수로 나누어 생각하세요. 버튼 문제는 이전 상태와 현재 상태를 비교하는 부분이 핵심입니다.'
  }

  return '정답 키워드를 나열한 뒤, 각 키워드가 어떤 역할을 하는지 한 문장씩 설명해 보세요.'
}
