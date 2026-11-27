import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import ComparisonPair from './ComparisonPair.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Wiersze</p>' }));

const LEFT = { ...emptyArtworkInput(), title: 'Twoja Wenus', authorUnknown: true };
const RIGHT = { ...emptyArtworkInput(), title: 'Wenus z albumu', authorUnknown: true };

describe('ComparisonPair', () => {
	it('shows both stages with their headings and what goes under them', async () => {
		await render(ComparisonPair, {
			left: LEFT,
			right: RIGHT,
			headings: [m.compare.mine, m.compare.album],
			children
		});

		await expect.element(page.getByText(m.compare.mine)).toBeVisible();
		await expect.element(page.getByText(m.compare.album)).toBeVisible();
		await expect.element(page.getByText('Wenus z albumu')).toBeVisible();
		await expect.element(page.getByText('Wiersze')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.compare.change }))
			.not.toBeInTheDocument();
	});

	it('offers to change either artwork when it can', async () => {
		const onchange = vi.fn();
		await render(ComparisonPair, { left: LEFT, right: RIGHT, onchange, children });

		await page.getByRole('button', { name: m.compare.change }).last().click();

		expect(onchange).toHaveBeenCalledWith('right');
	});
});
