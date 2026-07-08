import { describe, expect, it } from 'vitest'
import { detectInputIntent, isTextUpload } from './inputIntent'

describe('publisher input intent', () => {
  it('detects URL input as style extraction', () => {
    expect(detectInputIntent('https://linear.app')).toBe('extract-style')
  })

  it('detects plain text input as website generation', () => {
    expect(detectInputIntent('这是一个产品介绍')).toBe('generate-page')
  })

  it('accepts markdown and txt uploads as text input', () => {
    expect(isTextUpload(new File(['# Demo'], 'demo.md', { type: 'text/markdown' }))).toBe(true)
    expect(isTextUpload(new File(['Demo'], 'demo.txt', { type: 'text/plain' }))).toBe(true)
  })
})
