// Поле формы: клиентская ошибка показывается через CSS (:user-invalid + .error),
// серверная — всегда, через aria-invalid

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint: string
  serverError?: string
}

export function Field({ label, hint, serverError, ...input }: FieldProps) {
  return (
    <label className="field">
      {label}
      <input className="input" required aria-invalid={serverError ? true : undefined} {...input} />
      <small className="error">{hint}</small>
      {serverError && <small className="server-error">{serverError}</small>}
    </label>
  )
}

// 8(XXX)XXX-XX-XX — маска ввода телефона
export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, '')
  if (digits && digits[0] !== '8') digits = '8' + digits
  digits = digits.slice(0, 11)
  const parts = [digits.slice(0, 1), digits.slice(1, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)]
  let result = parts[0]
  if (digits.length > 1) result += `(${parts[1]}`
  if (digits.length > 4) result += `)${parts[2]}`
  if (digits.length > 7) result += `-${parts[3]}`
  if (digits.length > 9) result += `-${parts[4]}`
  return result
}

// ДД.ММ.ГГГГ — маска ввода даты
export function formatDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.')
}
