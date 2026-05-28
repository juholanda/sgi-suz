import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get active planta from cookie
  const cookieStore = await cookies()
  const plantaId = cookieStore.get('sgi_planta_ativa')?.value

  if (!plantaId) {
    return NextResponse.json(
      { error: 'Nenhuma planta ativa selecionada. Selecione uma planta antes de importar.' },
      { status: 400 }
    )
  }

  // Validate the planta exists
  const planta = await prisma.planta.findUnique({ where: { id: plantaId } })
  if (!planta) {
    return NextResponse.json(
      { error: 'Planta ativa não encontrada.' },
      { status: 400 }
    )
  }

  // Parse the uploaded file
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Formato de requisição inválido. Envie um FormData com o arquivo.' },
      { status: 400 }
    )
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json(
      { error: 'Nenhum arquivo enviado.' },
      { status: 400 }
    )
  }

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Parse Excel/CSV
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível ler o arquivo. Verifique se é um arquivo Excel ou CSV válido.' },
      { status: 400 }
    )
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return NextResponse.json(
      { error: 'Arquivo vazio ou sem planilhas.' },
      { status: 400 }
    )
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Planilha vazia. Adicione ao menos uma linha de dados.' },
      { status: 400 }
    )
  }

  // Pre-load all areas for this planta (case-insensitive lookup)
  const areasInPlanta = await prisma.area.findMany({
    where: { plantaId, ativa: true },
  })

  // Build lookup maps: by nome (lowercase) and by codigo (lowercase)
  const areaByNome = new Map<string, typeof areasInPlanta[0]>()
  const areaByCodigo = new Map<string, typeof areasInPlanta[0]>()
  for (const area of areasInPlanta) {
    areaByNome.set(area.nome.toLowerCase().trim(), area)
    if (area.codigo) {
      areaByCodigo.set(area.codigo.toLowerCase().trim(), area)
    }
  }

  // Normalize column headers — accept variations
  function findColumn(row: Record<string, unknown>, candidates: string[]): string | undefined {
    const keys = Object.keys(row)
    for (const candidate of candidates) {
      const found = keys.find(k => k.toLowerCase().trim() === candidate.toLowerCase())
      if (found) return found
    }
    return undefined
  }

  // Detect column names from the first row
  const firstRow = rows[0]
  const tagCol = findColumn(firstRow, ['TAG', 'Tag', 'tag'])
  const descCol = findColumn(firstRow, ['Descrição', 'Descricao', 'DESCRICAO', 'DESCRIÇÃO', 'descricao', 'descrição'])
  const areaCol = findColumn(firstRow, ['Área', 'Area', 'AREA', 'ÁREA', 'area', 'área'])

  if (!tagCol) {
    return NextResponse.json(
      { error: 'Coluna "TAG" não encontrada na planilha. Colunas esperadas: TAG, Descrição, Área' },
      { status: 400 }
    )
  }
  if (!descCol) {
    return NextResponse.json(
      { error: 'Coluna "Descrição" não encontrada na planilha. Colunas esperadas: TAG, Descrição, Área' },
      { status: 400 }
    )
  }
  if (!areaCol) {
    return NextResponse.json(
      { error: 'Coluna "Área" não encontrada na planilha. Colunas esperadas: TAG, Descrição, Área' },
      { status: 400 }
    )
  }

  // Process each row
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    const tag = String(row[tagCol] ?? '').trim().toUpperCase()
    const descricao = String(row[descCol] ?? '').trim()
    const areaValue = String(row[areaCol] ?? '').trim()

    // Validate required fields
    if (!tag) {
      errors.push(`Linha ${rowNum}: TAG vazia, linha ignorada.`)
      continue
    }
    if (!descricao) {
      errors.push(`Linha ${rowNum}: Descrição vazia para TAG "${tag}", linha ignorada.`)
      continue
    }
    if (!areaValue) {
      errors.push(`Linha ${rowNum}: Área vazia para TAG "${tag}", linha ignorada.`)
      continue
    }

    // Lookup area by name or code (case-insensitive)
    const areaLower = areaValue.toLowerCase().trim()
    const area = areaByNome.get(areaLower) ?? areaByCodigo.get(areaLower)

    if (!area) {
      errors.push(`Linha ${rowNum}: Área "${areaValue}" não encontrada na planta "${planta.nome}" para TAG "${tag}".`)
      continue
    }

    // Upsert equipamento by tag
    try {
      const existing = await prisma.equipamento.findUnique({ where: { tag } })

      if (existing) {
        await prisma.equipamento.update({
          where: { tag },
          data: { descricao, areaId: area.id },
        })
        updated++
      } else {
        await prisma.equipamento.create({
          data: { tag, descricao, areaId: area.id, ativo: true },
        })
        created++
      }
    } catch (e: any) {
      errors.push(`Linha ${rowNum}: Erro ao salvar TAG "${tag}": ${e.message ?? 'erro desconhecido'}`)
    }
  }

  return NextResponse.json({ created, updated, errors })
}
