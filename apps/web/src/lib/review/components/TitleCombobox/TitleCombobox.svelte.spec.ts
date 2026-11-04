import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { TitleSuggestion } from '#lib/review/typed-title/typed-title.ts';
import TitleCombobox from './TitleCombobox.svelte';

const artworks = [
	testArtwork(1, 'Dama z gronostajem', { id: 'ermine', authors: ['Leonardo da Vinci'] }),
	testArtwork(2, 'Dama z jednorożcem', { id: 'unicorn', authors: [] }),
	testArtwork(3, 'Ur', { id: 'ur', authors: [] })
];

function combobox(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.review.quiz.typedLabel });
}

function press(key: string): void {
	combobox()
		.element()
		.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function renderBox(verdict?: 'right' | 'wrong'): {
	oncheck: ReturnType<typeof vi.fn>;
	selected: () => TitleSuggestion | undefined;
} {
	const oncheck = vi.fn();
	const props = $state<{ selected?: TitleSuggestion }>({});
	render(TitleCombobox, {
		props: {
			artworks,
			oncheck,
			verdict,
			get selected() {
				return props.selected;
			},
			set selected(value) {
				props.selected = value;
			}
		}
	});
	return { oncheck, selected: () => props.selected };
}

describe('TitleCombobox', () => {
	it('suggests nothing before three letters', async () => {
		renderBox();

		await combobox().fill('da');

		expect(combobox().element().getAttribute('aria-expanded')).toBe('false');
	});

	it('suggests titles with their authors and picks one with the keys', async () => {
		const box = renderBox();

		await combobox().fill('dam');

		await expect.element(page.getByRole('option', { name: /Dama z gronostajem/ })).toBeVisible();
		await expect.element(page.getByText('Leonardo da Vinci')).toBeVisible();
		press('ArrowDown');
		press('Enter');
		expect(box.selected()?.ids).toEqual(['unicorn']);
		await expect.element(combobox()).toHaveValue('Dama z jednorożcem');
		press('Enter');
		expect(box.oncheck).toHaveBeenCalledOnce();
	});

	it('picks a suggestion with the pointer', async () => {
		const box = renderBox();

		await combobox().fill('ur');
		await page.getByRole('option', { name: 'Ur' }).click();

		expect(box.selected()?.ids).toEqual(['ur']);
	});

	it('says when no title matches', async () => {
		renderBox();

		await combobox().fill('xyz');

		await expect.element(page.getByText(m.review.quiz.typedEmpty)).toBeVisible();
	});

	it('locks the field once answered', async () => {
		renderBox('wrong');

		await expect.element(combobox()).toBeDisabled();
	});
});
