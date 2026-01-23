import { describe, it, expect } from 'vitest'

describe('App setup', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true)
  })
  
  it('should have crypto available', () => {
    expect(crypto.randomUUID).toBeDefined()
  })
})
