import { expect, test } from '@playwright/test';

const appPath = '/dominatus-tracker/';

test.beforeEach(async ({ page }) => {
  await page.goto(appPath);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('loads the campaign dashboard without a runtime error', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Campaign Phase' })).toBeVisible();
  await expect(page.getByText('No Location drawn yet for this phase.')).toBeVisible();
});

test('autosaves campaign edits across a reload', async ({ page }) => {
  await page.locator('header textarea').fill('Siege of Volcanus');
  await page.reload();
  await expect(page.locator('header textarea')).toHaveValue('Siege of Volcanus');
});

test('can add and edit a commander in the roster', async ({ page }) => {
  await page.getByRole('button', { name: 'Roster' }).click();
  await page.getByRole('button', { name: '+ Muster Commander' }).click();
  await page.getByText('Unnamed Army', { exact: true }).click();

  const fields = page.locator('input[type="text"]');
  await fields.nth(0).fill('Callum');
  await fields.nth(1).fill('Steel Legion');
  await fields.nth(2).fill('Astra Militarum');

  await expect(page.getByText('Steel Legion', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Roster' }).click();
  await expect(page.getByText('Steel Legion', { exact: true })).toBeVisible();
});

test('records a battle for two commanders', async ({ page }) => {
  await page.getByRole('button', { name: 'Roster' }).click();
  const muster = page.getByRole('button', { name: '+ Muster Commander' });
  await muster.click();
  await muster.click();

  await page.getByRole('button', { name: 'Battle Log' }).click();
  await page.getByRole('button', { name: '+ Record Battle' }).click();

  const selects = page.locator('select');
  await selects.nth(1).selectOption({ index: 1 });
  await selects.nth(3).selectOption({ index: 1 });
  const scoreFields = page.locator('input[placeholder="0"]');
  await scoreFields.nth(0).fill('20');
  await scoreFields.nth(1).fill('10');
  await page.getByRole('button', { name: 'Seal Battle Record' }).click();

  await expect(page.getByText('20VP', { exact: false })).toBeVisible();
  await expect(page.getByText('10VP', { exact: false })).toBeVisible();
});

test('exports the locally stored campaign as JSON', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('dominatus-campaign.json');
  const content = await download.createReadStream();
  let json = '';
  for await (const chunk of content) json += chunk;
  expect(JSON.parse(json)).toMatchObject({ campaignName: 'The Dominatus Campaign', players: [], battles: [] });
});

test('imports a valid campaign JSON file', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'campaign.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      campaignName: 'Imported Campaign',
      currentPhase: 1,
      locationByPhase: { 1: null, 2: null, 3: null },
      locationControlByPhase: {},
      briefingNotesByPhase: { 1: '', 2: '', 3: '' },
      campaignNarrative: '',
      narrativeOverrides: {},
      phaseHistory: [],
      players: [],
      battles: [],
    })),
  });

  await expect(page.locator('header textarea')).toHaveValue('Imported Campaign');
});