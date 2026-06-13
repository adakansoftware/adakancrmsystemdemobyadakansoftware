import { expect, test, type Page } from '@playwright/test'

const adminEmail = 'admin@adakancrm.com'
const adminPassword = 'Admin123!'

async function login(page: Page) {
  await page.goto('/login')
  const emailField = page.getByRole('textbox', { name: 'Email' })

  if (await emailField.count()) {
    await emailField.fill(adminEmail)
    await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 })
}

async function chooseSelectOption(
  page: Page,
  trigger: ReturnType<Page['locator']>,
  optionLabel: string,
) {
  await trigger.click()
  const content = page.locator('[data-slot="select-content"]').last()
  await expect(content).toBeVisible()
  const option = content.getByText(optionLabel, { exact: true })
  await option.click()
}

test.describe('CRM smoke flows', () => {
  test('protects authenticated routes', async ({ page }) => {
    await page.goto('/musteriler')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'CRM Login' })).toBeVisible()
  })

  test('logs in with seeded admin user', async ({ page }) => {
    await login(page)
    await expect(page.getByText('CRM operasyonunuzun canli gorunumu')).toBeVisible()
  })

  test('closes quick create modal and clears the query string on cancel', async ({ page }) => {
    await login(page)
    await page.goto('/?quickCreate=company')

    await expect(page.getByRole('dialog', { name: 'Hızlı Oluştur' })).toBeVisible()
    await page.getByRole('button', { name: 'İptal' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog', { name: 'Hızlı Oluştur' })).toHaveCount(0)
  })

  test('creates a company from quick create and returns to a clean URL', async ({ page }) => {
    await login(page)
    await page.goto('/?quickCreate=company')

    const companyName = `Smoke Firma ${Date.now()}`
    await page.getByRole('textbox', { name: 'Başlık / Ad Soyad' }).fill(companyName)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog', { name: 'Hızlı Oluştur' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('creates a contact from quick create and returns to the customers page', async ({ page }) => {
    await login(page)
    await page.goto('/musteriler?quickCreate=contact')

    const contactName = `Smoke Kisi ${Date.now()}`
    await page.getByRole('textbox', { name: 'Başlık / Ad Soyad' }).fill(contactName)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page).toHaveURL('/musteriler')
    await expect(page.getByRole('dialog', { name: 'Hızlı Oluştur' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Musteriler' })).toBeVisible()
  })

  test('updates a lead status from the leads table', async ({ page }) => {
    await login(page)
    await page.goto('/leads')

    const firstLeadRow = page.locator('[data-testid^="lead-row-"]').first()
    await expect(firstLeadRow).toBeVisible()

    const statusTrigger = firstLeadRow.locator('[data-testid^="lead-status-"]')
    const currentStatus = ((await statusTrigger.textContent()) ?? '').trim()
    const nextStatus = currentStatus === 'Nitelikli' ? 'Kaybedildi' : 'Nitelikli'

    await chooseSelectOption(page, statusTrigger, nextStatus)
    await expect(firstLeadRow).toContainText(nextStatus)
  })

  test('updates a deal stage from the deals table', async ({ page }) => {
    await login(page)
    await page.goto('/anlasmalar')

    const firstDealRow = page.locator('[data-testid^="deal-row-"]').first()
    await expect(firstDealRow).toBeVisible()

    const stageTrigger = firstDealRow.locator('[data-testid^="deal-stage-"]')
    const currentStage = ((await stageTrigger.textContent()) ?? '').trim()
    const nextStage = currentStage === 'Teklif' ? 'Pazarlik' : 'Teklif'

    await chooseSelectOption(page, stageTrigger, nextStage)
    await expect(firstDealRow).toContainText(nextStage)
  })

  test('updates a task status from the tasks list', async ({ page }) => {
    await login(page)
    await page.goto('/gorevler')

    const firstTaskRow = page.locator('[data-testid^="task-row-"]').first()
    await expect(firstTaskRow).toBeVisible()

    const statusTrigger = firstTaskRow.locator('[data-testid^="task-status-"]')
    const currentStatus = ((await statusTrigger.textContent()) ?? '').trim()
    const nextStatus = currentStatus === 'Bekliyor' ? 'Devam Ediyor' : 'Bekliyor'

    await chooseSelectOption(page, statusTrigger, nextStatus)
    await expect(firstTaskRow).toContainText(nextStatus)
  })
})
