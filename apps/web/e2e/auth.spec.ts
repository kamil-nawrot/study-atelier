import { m } from '#lib/i18n/i18n.ts';
import { expect, signIn, test } from './fixtures.ts';

test('signs in to an empty atelier and signs out', async ({ page, learner }) => {
	await signIn(page, learner);

	await expect(page.getByRole('heading', { name: m.atelier.welcome.title })).toBeVisible();

	await page.getByRole('button', { name: m.menu.signOut }).click();
	await expect(page.getByRole('heading', { level: 1, name: m.signIn.title })).toBeVisible();
	await expect(page).toHaveURL(/\/sign-in$/);
});

test('refuses a wrong password', async ({ page, learner }) => {
	await page.goto('/sign-in');
	await page.getByLabel(m.common.email).fill(learner.email);
	await page.getByLabel(m.common.password).fill('not-the-password');
	await page.getByRole('button', { name: m.signIn.submit }).click();

	await expect(page.getByText(m.signIn.errorTitle)).toBeVisible();
	await expect(page).toHaveURL(/\/sign-in$/);
});
