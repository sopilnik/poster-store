import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantityStepper } from './QuantityStepper'

function setup(value: number, onChange = vi.fn()) {
  render(
    <QuantityStepper
      value={value}
      onChange={onChange}
      label="Quantity"
      decreaseLabel="Decrease quantity"
      increaseLabel="Increase quantity"
    />
  )
  return { onChange, field: screen.getByRole('textbox', { name: 'Quantity' }) }
}

test('typing a digit commits the value at once', () => {
  const { onChange, field } = setup(1)
  fireEvent.change(field, { target: { value: '5' } })
  expect(onChange).toHaveBeenCalledWith(5)
})

test('typing above the maximum clamps to it', () => {
  const { onChange, field } = setup(1)
  fireEvent.change(field, { target: { value: '50' } })
  expect(field).toHaveValue('10')
  expect(onChange).toHaveBeenCalledWith(10)
})

test('a non-digit character changes nothing', () => {
  const { onChange, field } = setup(1)
  fireEvent.change(field, { target: { value: '1a' } })
  expect(field).toHaveValue('1')
  expect(onChange).not.toHaveBeenCalled()
})

test('clearing the field and blurring restores the committed value and calls nothing', () => {
  const { onChange, field } = setup(3)
  fireEvent.change(field, { target: { value: '' } })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.blur(field)
  expect(field).toHaveValue('3')
  expect(onChange).not.toHaveBeenCalled()
})

test('ArrowUp from 1 gives 2', async () => {
  const { onChange, field } = setup(1)
  field.focus()
  await userEvent.keyboard('{ArrowUp}')
  expect(onChange).toHaveBeenCalledWith(2)
})

test('the decrease button is disabled at the minimum', () => {
  setup(1)
  expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled()
})

test('the increase button is disabled at the maximum', () => {
  setup(10)
  expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled()
})

test('the field has the given accessible name', () => {
  const { field } = setup(1)
  expect(field).toHaveAccessibleName('Quantity')
})
