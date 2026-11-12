import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { m } from '#lib/i18n/i18n.ts';

export async function expectImageCredit(credit: string): Promise<void> {
	const button = page.getByRole('button', { name: m.artwork.creditLabel });
	await expect.element(button).toBeInTheDocument();
	if ((await button.element().getAttribute('aria-expanded')) !== 'true') await button.click();
	await expect.element(page.getByRole('tooltip')).toHaveTextContent(credit);
}
