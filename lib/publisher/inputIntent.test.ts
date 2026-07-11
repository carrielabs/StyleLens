import { describe, expect, it } from 'vitest'
import { detectInputIntent, isDataUpload, isTextUpload } from './inputIntent'

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

  it('accepts csv, json and xlsx uploads as data input', () => {
    expect(isDataUpload(new File(['date,revenue'], 'sales.csv', { type: 'text/csv' }))).toBe(true)
    expect(isDataUpload(new File(['[]'], 'sales.json', { type: 'application/json' }))).toBe(true)
    expect(isDataUpload(new File(['xlsx'], 'sales.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))).toBe(true)
    expect(isDataUpload(new File(['# Demo'], 'demo.md', { type: 'text/markdown' }))).toBe(false)
  })
})
