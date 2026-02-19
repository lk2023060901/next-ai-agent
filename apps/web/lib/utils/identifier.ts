export const IDENTIFIER_REGEX = /^[a-z][a-z0-9-]*$/

export function validateIdentifier(id: string): string | null {
  if (!id) return '标识符不能为空'
  if (id.length < 2) return '至少 2 个字符'
  if (id.length > 40) return '不超过 40 个字符'
  if (!IDENTIFIER_REGEX.test(id)) return '仅允许小写字母、数字和连字符，须以字母开头'
  return null
}

export function suggestIdentifier(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'agent'
}
