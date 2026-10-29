import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); });

test('all five tabs render and navigation history returns to the previous page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Corrige.');
  for (const [label, title] of [['Antes / Depois','Pequenas mudanças.'],['Código','Cada linha.'],['Arquitetura','Seis módulos.'],['Setup','Uma configuração.']]) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Arquitetura', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('interactive demo completes and can replay without external requests', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ver em ação', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Simulação concluída');
  await expect(page.locator('.file-change')).toContainText(['src/components/','src/utils/format.ts','src/hooks/useTheme.ts']);
  await page.getByRole('button', { name: 'Repetir demonstração' }).click();
  await expect(page.getByRole('status')).toHaveText('Simulação concluída');
});

test('examples switch and copying returns the selected code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/#antes-depois');
  await page.getByRole('button', { name: 'Imports', exact: true }).click();
  await expect(page.locator('.before-panel')).toContainText('@/Components/Button');
  await expect(page.locator('.after-panel')).toContainText('@/components/Button');
  await page.getByRole('button', { name: 'Copiar exemplo depois' }).click();
  await expect(page.getByRole('button', { name: 'Código copiado' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('@/components/Button');
});

test('file filters, search, copying and downloading use the real source', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/#codigo');
  await expect(page.locator('.file-item')).toHaveCount(14);
  await page.getByRole('button', { name: 'Config', exact: true }).click();
  await expect(page.locator('.file-item')).toHaveCount(5);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar arquivos' }).fill('fixer');
  await expect(page.locator('.file-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'src/fixer.js', exact: true }).click();
  await expect(page.locator('.editor-toolbar')).toContainText('src/fixer.js');
  await page.getByRole('button', { name: 'Copiar arquivo selecionado' }).click();
  const source = await readFile('action/src/fixer.js', 'utf8');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar arquivo selecionado' }).click();
  const download = await waiting;
  expect(download.suggestedFilename()).toBe('fixer.js');
  expect(await readFile((await download.path())!, 'utf8')).toBe(source);
  await page.getByRole('textbox', { name: 'Buscar arquivos' }).fill('arquivo-inexistente');
  await expect(page.getByText('Nenhum arquivo encontrado.')).toBeVisible();
});

test('architecture mode explains skipped stages and modules open their source', async ({ page }) => {
  await page.goto('/#arquitetura');
  await page.getByRole('button', { name: 'report', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nenhum arquivo é alterado.');
  await expect(page.getByText('Não executado em report', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: /Corretor/ }).click();
  await expect(page).toHaveURL(/#codigo$/);
  await expect(page.locator('.editor-toolbar')).toContainText('src/fixer.js');
});

test('setup configures the workflow and validates repository input', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/#setup');
  const repository = page.getByRole('textbox', { name: 'Repositório da Action' });
  await repository.fill('example-org/auto-organizer');
  await page.getByRole('button', { name: 'fix', exact: true }).click();
  await page.getByRole('button', { name: 'Copiar workflow configurado' }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('uses: example-org/auto-organizer/action@v2');
  expect(text).toContain('mode: fix');
  expect(text).toContain('head.sha');
  await repository.fill('invalid repository');
  await expect(repository).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Informe no formato usuario/repositorio.')).toBeVisible();
});

test('keyboard navigation and skip link preserve the active tab', async ({ page }) => {
  await page.goto('/#codigo');
  await page.getByRole('tab', { name: 'Código', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Arquitetura' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Setup', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('link', { name: 'Pular para o conteúdo' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#setup$/);
  await expect(page.locator('main')).toBeFocused();
});
