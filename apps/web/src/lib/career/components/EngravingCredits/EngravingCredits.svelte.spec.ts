import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import EngravingCredits from './EngravingCredits.svelte';

describe('EngravingCredits', () => {
	it('keeps the credits of the engravings behind a button', async () => {
		render(EngravingCredits, { props: { codes: ['collection', 'chronicle'] } });

		const panel = page.getByRole('dialog', { name: m.career.credits, includeHidden: true });
		await expect.element(panel).not.toBeVisible();
		await page.getByRole('button', { name: m.career.credits }).click();
		await expect.element(panel).toBeVisible();
		await expect
			.element(panel.getByRole('link', { name: /Musei Wormiani Historia/ }))
			.toHaveAttribute(
				'href',
				'https://commons.wikimedia.org/wiki/File:1655_-_Frontispiece_of_Museum_Wormiani_Historia.jpg'
			);
	});

	it('shows nothing when no engraving is shown', async () => {
		render(EngravingCredits, { props: { codes: ['chronicle'] } });

		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});
});
