import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import MergeRows from './MergeRows.svelte';

describe('MergeRows', () => {
	it('picks a value of a single field by a click on its cell', async () => {
		const onpick = vi.fn();
		await render(MergeRows, {
			rows: [
				{
					key: 'location',
					label: 'Miejsce',
					kind: 'pick',
					mine: [{ text: 'Wiedeń' }],
					album: [{ text: 'NHM', isNew: true }],
					fromAlbum: false,
					onpick
				}
			]
		});

		await expect
			.element(page.getByRole('button', { name: m.compare.keep('Wiedeń') }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText(m.compare.newValue)).toBeVisible();
		await page.getByRole('button', { name: m.compare.keep('NHM') }).click();

		expect(onpick).toHaveBeenCalledWith(true);
	});

	it('ticks the items of a list and shows an item both versions have without a checkbox', async () => {
		const ontoggle = vi.fn();
		await render(MergeRows, {
			rows: [
				{
					key: 'materials',
					label: 'Materiał',
					kind: 'tick',
					mine: [{ text: 'wapień', ticked: true, ontoggle: vi.fn() }],
					album: [{ text: 'Wapień' }, { text: 'ochra', ticked: false, ontoggle }]
				}
			]
		});

		await expect.element(page.getByRole('checkbox', { name: 'wapień' })).toBeChecked();
		expect(page.getByRole('checkbox').elements()).toHaveLength(2);
		await page.getByRole('checkbox', { name: 'ochra' }).click();

		expect(ontoggle).toHaveBeenCalledOnce();
	});

	it('says when both versions agree and when a value is missing', async () => {
		await render(MergeRows, {
			rows: [
				{ key: 'type', label: 'Typ', kind: 'same', value: [{ text: 'Rzeźba' }] },
				{ key: 'period', label: 'Okres', kind: 'plain', mine: [{ text: 'barok' }], album: [] }
			]
		});

		await expect
			.element(page.getByRole('group', { name: 'Typ' }))
			.toHaveTextContent(m.compare.same);
		await expect
			.element(page.getByRole('group', { name: 'Okres' }))
			.toHaveTextContent(m.compare.empty);
	});
});
