'use client'

import { useController, useForm, useWatch, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SHIPPING } from '@/catalog/sizes'
import { subtotalCents, totalCents } from '@/cart/totals'
import type { PricedLine } from '@/cart/types'
import { checkoutSchema, COUNTRIES, type CheckoutInput } from '@/checkout/schema'
import { formatCents } from '@/lib/money'
import { hasCheckoutApi } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderSummary } from './OrderSummary'

const COUNTRY_ITEMS = COUNTRIES.map(value => ({ label: value, value }))

const DEFAULT_VALUES: CheckoutInput = {
  email: '',
  fullName: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'United States',
  delivery: 'standard',
  payment: 'demo',
}

type TextFieldName = 'email' | 'fullName' | 'address' | 'city' | 'postalCode'

function TextField({
  control,
  name,
  label,
  type = 'text',
  autoComplete,
}: {
  control: Control<CheckoutInput>
  name: TextFieldName
  label: string
  type?: string
  autoComplete?: string
}) {
  const { field, fieldState } = useController({ control, name })
  const errorId = `${name}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? errorId : undefined}
        {...field}
      />
      {fieldState.error ? (
        <p role="alert" id={errorId} className="text-xs text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  )
}

function CountryField({ control }: { control: Control<CheckoutInput> }) {
  const { field } = useController({ control, name: 'country' })
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Country</span>
      <Select
        items={COUNTRY_ITEMS}
        value={field.value}
        onValueChange={value => {
          if (typeof value === 'string') field.onChange(value as CheckoutInput['country'])
        }}
      >
        <SelectTrigger aria-label="Country" aria-describedby="country-hint">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_ITEMS.map(item => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id="country-hint" className="text-xs text-muted-foreground">
        A short list for the demo.
      </p>
    </div>
  )
}

function DeliveryField({ control }: { control: Control<CheckoutInput> }) {
  const { field } = useController({ control, name: 'delivery' })
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Delivery</span>
      <RadioGroup
        aria-label="Delivery"
        value={field.value}
        onValueChange={value => field.onChange(value as CheckoutInput['delivery'])}
      >
        <Label className="flex items-center gap-2 font-normal">
          <RadioGroupItem value="standard" />
          Standard · {formatCents(SHIPPING.standard)}, free from $150
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <RadioGroupItem value="express" />
          Express · {formatCents(SHIPPING.express)}
        </Label>
      </RadioGroup>
    </div>
  )
}

function PaymentField({ control }: { control: Control<CheckoutInput> }) {
  const { field } = useController({ control, name: 'payment' })
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Payment</span>
      <RadioGroup
        aria-label="Payment"
        value={field.value}
        onValueChange={value => field.onChange(value as CheckoutInput['payment'])}
      >
        <Label className="flex items-center gap-2 font-normal">
          <RadioGroupItem value="demo" />
          Demo payment, no charge
        </Label>
        {hasCheckoutApi() ? (
          <div className="flex flex-col gap-1">
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="stripe" aria-describedby="stripe-hint" />
              Card via Stripe (test mode)
            </Label>
            <p id="stripe-hint" className="pl-6 text-xs text-muted-foreground">
              Test mode. Use card number 4242 4242 4242 4242 with any future date and any CVC. Nothing is charged.
            </p>
          </div>
        ) : null}
      </RadioGroup>
    </div>
  )
}

export function CheckoutForm({
  lines,
  onSubmit,
}: {
  lines: PricedLine[]
  onSubmit: (input: CheckoutInput) => void | Promise<void>
}) {
  const { control, handleSubmit, formState } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const delivery = useWatch({ control, name: 'delivery' })
  const payment = useWatch({ control, name: 'payment' })
  const subtotal = subtotalCents(lines)
  const total = totalCents(subtotal, delivery)
  const submitLabel = payment === 'stripe' ? 'Pay with card' : 'Place demo order'

  return (
    <form className="grid gap-8 md:grid-cols-[1fr_360px]" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="md:order-2">
        <OrderSummary lines={lines} delivery={delivery} />
      </div>
      <div className="flex flex-col gap-6 md:order-1">
        <p className="text-sm text-muted-foreground">
          {hasCheckoutApi()
            ? 'Choosing card payment sends your order lines to Stripe, in test mode. Your address stays in this browser either way.'
            : 'Nothing is sent anywhere. What you type stays in this browser and is cleared when you close the tab.'}
        </p>
        <TextField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <TextField control={control} name="fullName" label="Full name" autoComplete="name" />
        <TextField control={control} name="address" label="Address" autoComplete="street-address" />
        <TextField control={control} name="city" label="City" autoComplete="address-level2" />
        <TextField control={control} name="postalCode" label="Postal code" autoComplete="postal-code" />
        <CountryField control={control} />
        <DeliveryField control={control} />
        <PaymentField control={control} />
        <Button type="submit" disabled={formState.isSubmitting}>
          {submitLabel} · {formatCents(total)}
        </Button>
      </div>
    </form>
  )
}
