import { expect, test, type Page } from '@playwright/test'

const adminEmail = 'admin@adakancrm.com'
const adminPassword = 'Admin123!'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(adminEmail)
  await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
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
})
