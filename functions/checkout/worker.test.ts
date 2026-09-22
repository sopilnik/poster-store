// @vitest-environment node
import worker from './worker'

test('an unhandled error answers with a JSON 500 instead of throwing', async () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const request = new Request('https://api.test/checkout/session')

  const response = await worker.fetch(request, {} as never)

  expect(response.status).toBe(500)
  expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
  expect(response.headers.get('cache-control')).toBe('no-store')
  const body = await response.text()
  expect(body).not.toContain('Missing environment variable')
  expect(JSON.parse(body)).toEqual({ error: 'Internal error' })
  expect(errorSpy).toHaveBeenCalledOnce()
  errorSpy.mockRestore()
})
