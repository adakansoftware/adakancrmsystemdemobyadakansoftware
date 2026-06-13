'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InlineSelectOption<TValue extends string> = {
  value: TValue
  label: string
}

type InlineSelectFieldProps<TValue extends string> = {
  value: TValue
  options: InlineSelectOption<TValue>[]
  onValueChange: (value: TValue) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  testId?: string
  ariaLabel: string
}

export function InlineSelectField<TValue extends string>({
  value,
  options,
  onValueChange,
  disabled,
  className,
  placeholder,
  testId,
  ariaLabel,
}: InlineSelectFieldProps<TValue>) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        className={className ?? 'w-full'}
        data-testid={testId}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder}>
          {selectedOption?.label ?? value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
