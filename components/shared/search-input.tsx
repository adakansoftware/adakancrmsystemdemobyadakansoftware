import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  ariaLabel,
}: SearchInputProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn('pl-9', inputClassName)}
      />
    </div>
  )
}
