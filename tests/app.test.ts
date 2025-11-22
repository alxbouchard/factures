import { test, expect } from '@playwright/test';

/**
 * End‑to‑end sanity check for the Facture Magique app.
 * - Verifies that the home page loads.
 * - Checks that the main UI elements exist.
 * - Clicks the “🧪 TEST MODAL” button and validates the invoice modal content.
 */
test.describe('Facture Magique UI', () => {
    // Start Vite dev server once for the whole suite
    test.beforeAll(async () => {
        const { exec } = require('child_process');
        const dev = exec('npm run dev', { cwd: process.cwd() });
        // Wait until Vite prints the Local URL
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject('Vite server timeout'), 10000);
            dev.stdout?.on('data', (data: string) => {
                if (data.includes('Local:')) {
                    clearTimeout(timeout);
                    resolve(null);
                }
            });
        });
        // Store process for later termination
        (global as any).viteProcess = dev;
    });

    test.afterAll(async () => {
        const dev = (global as any).viteProcess;
        if (dev) dev.kill('SIGINT');
    });

    test('homepage displays main elements', async ({ page }) => {
        await page.goto('http://localhost:5173');
        await expect(page.locator('text=✨ Facture Magique')).toBeVisible();
        await expect(page.getByRole('button', { name: /PARLER/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /TEST MODAL/i })).toBeVisible();
        await page.screenshot({ path: 'artifacts/homepage.png' });
    });

    test('test modal shows a generated invoice', async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.getByRole('button', { name: /TEST MODAL/i }).click();

        // Modal is rendered via portal with high z‑index
        const modal = page.locator('div[role="dialog"], .fixed.inset-0.z-\[9999\]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Verify key fields inside the modal
        await expect(modal.getByText(/Facture Créée!/i)).toBeVisible();
        await expect(modal.getByText(/Numéro de facture/i)).toBeVisible();
        await expect(modal.getByText(/Sous‑total/i)).toBeVisible();
        await expect(modal.getByText(/TPS/i)).toBeVisible();
        await expect(modal.getByText(/TVQ/i)).toBeVisible();
        await expect(modal.getByText(/TOTAL/i)).toBeVisible();

        await page.screenshot({ path: 'artifacts/modal_filled.png' });

        // Close the modal
        await modal.getByRole('button', { name: /Fermer/i }).click();
        await expect(modal).toBeHidden();
        await page.screenshot({ path: 'artifacts/modal_closed.png' });
    });
});
