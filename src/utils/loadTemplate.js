import fs from 'fs'
import path from 'path'

export function loadEmailTemplate(filename, replacements = {}) {
  const filePath = path.join(process.cwd(), 'src/utils/templates', filename)

  let template = fs.readFileSync(filePath, 'utf-8')

  Object.keys(replacements).forEach(key => {
    template = template.replaceAll(`{{${key}}}`, replacements[key])
  })

  return template
}
