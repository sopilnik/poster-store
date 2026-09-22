import { mulberry32 } from './prng'
test('seed 42 produces a pinned sequence', () => {
  const rand = mulberry32(42)
  expect([rand(), rand(), rand()]).toEqual([
    0.6011037519201636,
    0.44829055899754167,
    0.8524657934904099,
  ])
})
test('same seed produces the same first five numbers', () => {
  const a = mulberry32(42), b = mulberry32(42)
  const seqA = [a(), a(), a(), a(), a()], seqB = [b(), b(), b(), b(), b()]
  expect(seqA).toEqual(seqB)
})
test('different seeds produce different sequences', () => {
  const a = mulberry32(1), b = mulberry32(2)
  const seqA = [a(), a(), a(), a(), a()], seqB = [b(), b(), b(), b(), b()]
  expect(seqA).not.toEqual(seqB)
})
test('all values fall in [0, 1)', () => {
  const rand = mulberry32(7)
  for (let i = 0; i < 200; i++) {
    const n = rand()
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThan(1)
  }
})
