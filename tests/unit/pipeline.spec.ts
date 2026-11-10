import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/lib/db/generated/prisma/client'
import { db } from '@/lib/db/prisma'
import {
  createDealStageHistory,
  createDealValueHistory,
  getDealPipelineBoard,
} from '@/lib/crm/pipeline'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    pipeline: { findFirst: vi.fn() },
    deal: { findMany: vi.fn() },
    dealStageHistory: { create: vi.fn() },
    dealValueHistory: { create: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createDealStageHistory', () => {
  it('converts a plain amount to a Decimal', async () => {
    vi.mocked(db.dealStageHistory.create).mockResolvedValue({ id: 'hist-1' } as never)

    await createDealStageHistory({
      dealId: 'deal-1',
      toPipelineId: 'pipe-1',
      toStageId: 'stage-2',
      amountSnapshot: 12500,
      currency: 'TRY',
    })

    const data = vi.mocked(db.dealStageHistory.create).mock.calls[0][0].data
    expect(data.amountSnapshot).toBeInstanceOf(Prisma.Decimal)
    expect(data.amountSnapshot.toString()).toBe('12500')
    expect(data).toMatchObject({
      dealId: 'deal-1',
      actorId: null,
      fromPipelineId: null,
      fromStageId: null,
      toPipelineId: 'pipe-1',
      toStageId: 'stage-2',
      currency: 'TRY',
      note: null,
    })
  })

  it('keeps an existing Decimal snapshot untouched', async () => {
    vi.mocked(db.dealStageHistory.create).mockResolvedValue({ id: 'hist-2' } as never)
    const amount = new Prisma.Decimal('99.95')

    await createDealStageHistory({
      dealId: 'deal-1',
      toPipelineId: 'pipe-1',
      toStageId: 'stage-2',
      amountSnapshot: amount,
      currency: 'TRY',
    })

    const data = vi.mocked(db.dealStageHistory.create).mock.calls[0][0].data
    expect(data.amountSnapshot).toBe(amount)
  })
})

describe('createDealValueHistory', () => {
  it('allows a null previous value', async () => {
    vi.mocked(db.dealValueHistory.create).mockResolvedValue({ id: 'vh-1' } as never)

    await createDealValueHistory({
      dealId: 'deal-1',
      previousValue: null,
      newValue: 15000,
      currency: 'TRY',
    })

    const data = vi.mocked(db.dealValueHistory.create).mock.calls[0][0].data
    expect(data.previousValue).toBeNull()
    expect(data.newValue).toBeInstanceOf(Prisma.Decimal)
  })

  it('converts a numeric previous value', async () => {
    vi.mocked(db.dealValueHistory.create).mockResolvedValue({ id: 'vh-2' } as never)

    await createDealValueHistory({
      dealId: 'deal-1',
      previousValue: 12000,
      newValue: new Prisma.Decimal('15000.50'),
      currency: 'TRY',
      reason: 'Kampanya',
    })

    const data = vi.mocked(db.dealValueHistory.create).mock.calls[0][0].data
    expect(data.previousValue).toBeInstanceOf(Prisma.Decimal)
    expect(String(data.previousValue)).toBe('12000')
    expect(data.reason).toBe('Kampanya')
  })
})

describe('getDealPipelineBoard', () => {
  const stages = [
    { id: 'stage-1', name: 'Gorusme', key: 'discovery', position: 1, probability: 10, isClosed: false, isWon: false },
    { id: 'stage-2', name: 'Kazanildi', key: 'won', position: 2, probability: 100, isClosed: true, isWon: true },
  ]

  const deals = [
    {
      id: 'deal-1',
      title: 'Yeni Proje',
      stageId: 'stage-1',
      amount: new Prisma.Decimal('10000'),
      currency: 'TRY',
      status: 'OPEN',
      probability: 80,
      expectedCloseAt: new Date('2026-12-01T00:00:00.000Z'),
      company: { name: 'Aydin Hafriyat' },
      owner: { firstName: 'Ada', lastName: 'Kan' },
    },
    {
      id: 'deal-2',
      title: 'Kaybedilen',
      stageId: 'stage-2',
      amount: new Prisma.Decimal('5000'),
      currency: 'TRY',
      status: 'LOST',
      probability: 20,
      expectedCloseAt: null,
      company: null,
      owner: null,
    },
    {
      id: 'deal-3',
      title: 'Kazanilan',
      stageId: 'stage-2',
      amount: new Prisma.Decimal('20000'),
      currency: 'TRY',
      status: 'WON',
      probability: 100,
      expectedCloseAt: null,
      company: { name: 'Beta A.S.' },
      owner: { firstName: 'Caner', lastName: 'Aydin' },
    },
  ]

  it('returns null when no pipeline exists', async () => {
    vi.mocked(db.pipeline.findFirst).mockResolvedValue(null)

    expect(await getDealPipelineBoard()).toBeNull()
    expect(db.deal.findMany).not.toHaveBeenCalled()
  })

  it('builds the board with stage grouping, fallbacks and metrics', async () => {
    vi.mocked(db.pipeline.findFirst).mockResolvedValue({
      id: 'pipe-1',
      name: 'Satis',
      key: 'satis',
      stages,
    } as never)
    vi.mocked(db.deal.findMany).mockResolvedValue(deals as never)

    const board = await getDealPipelineBoard()

    expect(board?.pipeline).toEqual({ id: 'pipe-1', name: 'Satis', key: 'satis' })
    expect(board?.stages).toHaveLength(2)

    const discovery = board?.stages[0]
    expect(discovery?.deals).toHaveLength(1)
    expect(discovery?.deals[0]).toMatchObject({
      id: 'deal-1',
      company: 'Aydin Hafriyat',
      ownerName: 'Ada Kan',
      ownerInitials: 'AK',
      amount: 10000,
      priority: 'HIGH',
      dueDate: '2026-12-01T00:00:00.000Z',
    })

    const closed = board?.stages[1]
    const unassigned = closed?.deals.find((deal) => deal.id === 'deal-2')
    expect(unassigned).toMatchObject({
      company: '-',
      ownerName: 'common.unassigned',
      ownerInitials: '--',
      dueDate: '',
      priority: 'LOW',
    })

    expect(board?.metrics).toEqual({ totalValue: 35000, wonValue: 20000, lostValue: 5000 })
  })

  it('queries a specific non-archived DEAL pipeline by id', async () => {
    vi.mocked(db.pipeline.findFirst).mockResolvedValue(null)

    await getDealPipelineBoard('pipe-2')

    expect(vi.mocked(db.pipeline.findFirst).mock.calls[0][0]).toMatchObject({
      where: { id: 'pipe-2', entityType: 'DEAL', archivedAt: null },
    })
  })
})
