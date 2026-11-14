import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MeaningPicker from './MeaningPicker.svelte';

const meanings = [
	{ id: 'm1', text: 'transience, death' },
	{ id: 'm2', text: 'penance' }
];

describe('MeaningPicker', () => {
	beforeEach(() => {
		document.body.style.paddingLeft = '50vw';
	});

	it('offers all meanings first, marks the current choice and picks one', async () => {
		const onpick = vi.fn<(meaningId?: string) => void>();
		render(MeaningPicker, { meanings, onpick });

		const toggle = page.getByRole('button', { name: m.exhibitions.bar.meaning });
		await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
		await userEvent.click(toggle);
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.allMeanings }))
			.toHaveAttribute('aria-pressed', 'true');

		await userEvent.click(page.getByRole('button', { name: 'penance' }));

		expect(onpick).toHaveBeenCalledWith('m2');
		expect(document.querySelector('.option')).toBeNull();
	});

	it('goes back to all meanings', async () => {
		const onpick = vi.fn<(meaningId?: string) => void>();
		render(MeaningPicker, { meanings, meaningId: 'm2', onpick });

		const toggle = page.getByRole('button', { name: m.exhibitions.bar.meaning });
		await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
		await userEvent.click(toggle);
		await expect
			.element(page.getByRole('button', { name: 'penance' }))
			.toHaveAttribute('aria-pressed', 'true');
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.allMeanings }));

		expect(onpick).toHaveBeenCalledWith(undefined);
	});

	it('closes on Escape', async () => {
		render(MeaningPicker, { meanings, onpick: vi.fn() });

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.meaning }));
		document
			.querySelector('.option')
			?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		await expect.poll(() => document.querySelector('.option')).toBeNull();
	});
});
