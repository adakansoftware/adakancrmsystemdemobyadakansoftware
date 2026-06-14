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

    await expect(page.getByRole('dialog', { name: 'Hizli Olustur' })).toBeVisible()
    await page.getByRole('button', { name: 'Iptal' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog', { name: 'Hizli Olustur' })).toHaveCount(0)
  })

  test('creates a company from quick create and returns to a clean URL', async ({ page }) => {
    await login(page)
    await page.goto('/?quickCreate=company')

    const companyName = `Smoke Firma ${Date.now()}`
    await page.getByRole('textbox', { name: 'Baslik / Ad Soyad' }).fill(companyName)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('dialog', { name: 'Hizli Olustur' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('creates a contact from quick create and returns to the customers page', async ({ page }) => {
    await login(page)
    await page.goto('/musteriler?quickCreate=contact')

    const contactName = `Smoke Kisi ${Date.now()}`
    await page.getByRole('textbox', { name: 'Baslik / Ad Soyad' }).fill(contactName)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page).toHaveURL('/musteriler')
    await expect(page.getByRole('dialog', { name: 'Hizli Olustur' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Musteriler' })).toBeVisible()
  })

  test('updates a lead status from the leads table', async ({ page }) => {
    await login(page)
    await page.goto('/leads')

    const firstLeadRow = page.locator('[data-testid^="lead-row-"]').first()
    await expect(firstLeadRow).toBeVisible()

    const statusTestId = await firstLeadRow
      .locator('[data-testid^="lead-status-"]')
      .getAttribute('data-testid')
    const statusTrigger = page.locator(`[data-testid="${statusTestId}"]`)
    const currentStatus = ((await statusTrigger.textContent()) ?? '').trim()
    const nextStatus = currentStatus === 'Nitelikli' ? 'Kaybedildi' : 'Nitelikli'

    await chooseSelectOption(page, statusTrigger, nextStatus)
    await expect(statusTrigger).toContainText(nextStatus)
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

  test('filters customers by search and opens a customer detail page', async ({ page }) => {
    await login(page)
    await page.goto('/musteriler?q=Caner')

    await expect(page.getByRole('heading', { name: 'Musteriler' })).toBeVisible()
    await expect(page.getByText('Arama: Caner')).toBeVisible()

    const firstCustomerLink = page.locator('tbody tr a[href^="/musteriler/"]').first()
    await expect(firstCustomerLink).toBeVisible()
    await firstCustomerLink.click()

    await expect(page).toHaveURL(/\/musteriler\/.+/)
    await expect(page.getByText('Kisi Bilgileri')).toBeVisible()
    await expect(page.getByText('Aktivite Akisi')).toBeVisible()
  })

  test('opens a deal detail page from the deals table', async ({ page }) => {
    await login(page)
    await page.goto('/anlasmalar')

    const firstDealLink = page.locator('tbody tr a[href^="/anlasmalar/"]').first()
    await expect(firstDealLink).toBeVisible()
    await firstDealLink.click()

    await expect(page).toHaveURL(/\/anlasmalar\/.+/)
    await expect(page.getByText('Deal Bilgileri')).toBeVisible()
    await expect(page.getByText('Stage Gecmisleri')).toBeVisible()
  })

  test('filters pipeline cards and navigates to a deal detail page', async ({ page }) => {
    await login(page)
    await page.goto('/pipeline')

    const firstDealLink = page.locator('section a[href^="/anlasmalar/"]').first()
    await expect(firstDealLink).toBeVisible()
    const firstDealTitle = ((await firstDealLink.textContent()) ?? '').trim()

    await page.getByPlaceholder('Deal, firma veya sorumlu ara...').fill(firstDealTitle)
    await expect(page.locator('section a[href^="/anlasmalar/"]').first()).toContainText(firstDealTitle)

    await firstDealLink.click()
    await expect(page).toHaveURL(/\/anlasmalar\/.+/)
  })

  test('shows the quotes workspace with weighted pipeline summary', async ({ page }) => {
    await login(page)
    await page.goto('/teklifler')

    await expect(page.getByRole('heading', { name: 'Teklifler' })).toBeVisible()
    await expect(page.getByText('Weighted Pipeline')).toBeVisible()
    await expect(page.getByText('Teklif Oncelik Listesi')).toBeVisible()
  })

  test('opens settings and creates a tag from the real tag management tab', async ({ page }) => {
    await login(page)
    await page.goto('/ayarlar')

    await page.getByRole('tab', { name: 'Etiketler' }).click()
    await expect(page.getByText('Etiket Kutuphanesi')).toBeVisible()

    const tagName = `Smoke Etiket ${Date.now()}`
    await page.getByRole('textbox', { name: 'Etiket Adi' }).fill(tagName)
    await page.getByRole('textbox', { name: 'Renk' }).fill('#0f766e')
    await page.getByRole('button', { name: 'Etiket Olustur' }).click()

    await expect(page.locator(`input[value="${tagName}"]`).first()).toBeVisible()
  })

  test('opens the company management dialog and saves a note', async ({ page }) => {
    await login(page)
    await page.goto('/firmalar')

    await page.getByRole('button', { name: 'Detay' }).first().click()
    await expect(page.getByRole('tab', { name: 'Notlar' })).toBeVisible()
    await page.getByRole('tab', { name: 'Notlar' }).click()

    const noteText = `Smoke firma notu ${Date.now()}`
    await page.getByPlaceholder('Kayda eklemek istedigin notu yaz').fill(noteText)
    await page.getByRole('button', { name: 'Not Ekle' }).click()

    await expect(page.getByText('Not eklendi')).toBeVisible()
  })

  test('opens the customer management dialog and updates the job title', async ({ page }) => {
    await login(page)
    await page.goto('/musteriler')

    const row = page.locator('tbody tr').first()
    await row.getByRole('button', { name: 'Yonet' }).click()
    await expect(page.getByRole('tab', { name: 'Genel' })).toBeVisible()

    const titleField = page.getByRole('textbox', { name: 'Unvan' })
    await titleField.fill(`Smoke Unvan ${Date.now()}`)
    await page.getByRole('button', { name: 'Kaydet' }).click()

    await expect(page.getByText(/Smoke Unvan/)).toBeVisible()
  })
})
