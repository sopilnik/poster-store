// @vitest-environment node
// wrangler deploy in CI overrides an existing DNS record for any hostname named in wrangler.toml
// without asking, and the deploy job runs on every push to main. A wrong hostname merged by accident
// (say the store's own domain) would replace that record with the Worker, so the exact routes and the
// switches that keep the Worker off workers.dev and off preview URLs are pinned here: the config is the
// source of truth, and any change to it has to change this test on purpose.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const configPath = fileURLToPath(new URL('../../wrangler.toml', import.meta.url))
const lines = readFileSync(configPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))

test('names the Worker', () => {
  expect(lines).toContain('name = "formline-checkout"')
})

test('keeps workers.dev off', () => {
  expect(lines).toContain('workers_dev = false')
})

test('keeps preview URLs off', () => {
  expect(lines).toContain('preview_urls = false')
})

test('routes only the custom domain', () => {
  expect(lines).toContain('routes = [{ pattern = "formline-api.sopilnik.dev", custom_domain = true }]')
  const otherRouteLines = lines.filter(
    (line) => line !== 'routes = [{ pattern = "formline-api.sopilnik.dev", custom_domain = true }]'
      && (line.startsWith('routes') || line.startsWith('route =') || line.startsWith('[[routes]]')),
  )
  expect(otherRouteLines).toEqual([])
})

test('has no other trigger', () => {
  const otherTriggerLines = lines.filter(
    (line) => line.startsWith('[triggers]')
      || line.startsWith('crons')
      || line.startsWith('[[services]]')
      || line.startsWith('[env.'),
  )
  expect(otherTriggerLines).toEqual([])
})
