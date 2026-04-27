type Rule = {
  required?: string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  custom?: (val: string) => string | undefined
}

export type ValidationRules<T extends string> = Partial<Record<T, Rule>>

export function validateField(value: string, rule?: Rule): string | undefined {
  if (!rule) return undefined
  const v = value.trim()

  if (rule.required && !v) return rule.required
  if (rule.minLength && v.length < rule.minLength.value) return rule.minLength.message
  if (rule.maxLength && v.length > rule.maxLength.value) return rule.maxLength.message
  if (rule.pattern && v && !rule.pattern.value.test(v)) return rule.pattern.message
  if (rule.min && v && Number(v) < rule.min.value) return rule.min.message
  if (rule.max && v && Number(v) > rule.max.value) return rule.max.message
  if (rule.custom) return rule.custom(v)

  return undefined
}

export function validateAll<T extends string>(
  form: Record<T, string>,
  rules: ValidationRules<T>
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const key of Object.keys(rules) as T[]) {
    const err = validateField(form[key] ?? '', rules[key])
    if (err) errors[key] = err
  }
  return errors
}

export function hasErrors<T extends string>(errors: Partial<Record<T, string>>): boolean {
  return Object.keys(errors).length > 0
}
