import { clsx, type ClassValue } from 'clsx'
import type { Question } from '../data/questions'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function isCodeQuestion(question: Question) {
  const type = question.questionType.toLowerCase()
  return Boolean(
    question.givenCode ||
      question.solutionCode ||
      type.includes('code') ||
      type.includes('coding') ||
      type.includes('program'),
  )
}

export function formatCodeSnippet(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

export function getPdfHref(question: Question) {
  if (!question.pdfReference) {
    return null
  }

  return question.pdfReference.page
    ? `${question.pdfReference.fileUrl}#page=${question.pdfReference.page}`
    : question.pdfReference.fileUrl
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
}
