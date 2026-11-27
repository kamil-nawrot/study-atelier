import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { albumItems } from '#lib/albums/album-items/album-items.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { albumWithItems } from '#lib/testing/albums/albums.ts';
import AlbumClosingStep from './AlbumClosingStep.svelte';

function renderStep(
	props: { selected?: string[]; error?: string; present?: boolean } = {}
): Record<string, ReturnType<typeof vi.fn>> {
	const handlers = { ontoggle: vi.fn(), onskipall: vi.fn(), onadd: vi.fn() };
	const entries = props.present ? [testEntry('a-1', 'Carving', { definition: 'Own.' })] : [];
	render(AlbumClosingStep, {
		items: albumItems(albumWithItems(), { entries, events: [], records: [], details: {} }, []),
		selected: new Set(props.selected ?? []),
		error: props.error,
		...handlers
	});
	return handlers;
}

describe('AlbumClosingStep', () => {
	it('lists the items by part with their state and excerpt', async () => {
		renderStep();

		for (const part of ['terms', 'figures', 'events', 'values'] as const) {
			await expect
				.element(page.getByRole('heading', { name: m.albums.closing.parts[part] }))
				.toBeVisible();
		}
		await expect.element(page.getByText('carving definition.')).toBeVisible();
		await expect.element(page.getByText(m.albums.closing.states.new).first()).toBeVisible();
	});

	it('counts the ticked items and adds them', async () => {
		const handlers = renderStep({ selected: ['term:carving', 'event:discovery'] });

		await expect.element(page.getByText(m.albums.closing.selected(2, 6))).toBeVisible();
		await page.getByRole('button', { name: m.albums.closing.add(2) }).click();
		expect(handlers.onadd).toHaveBeenCalled();
	});

	it('skips them all', async () => {
		const handlers = renderStep();

		await expect
			.element(page.getByRole('button', { name: m.albums.closing.add(0) }))
			.toBeDisabled();
		await page.getByRole('button', { name: m.albums.closing.skipAll }).click();
		expect(handlers.onskipall).toHaveBeenCalled();
	});

	it('ticks an item and leaves the ones already in the atelier unavailable', async () => {
		const handlers = renderStep({ present: true });

		await page.getByText('Sculptor', { exact: true }).click();
		expect(handlers.ontoggle).toHaveBeenCalledTimes(1);
		await expect.element(page.getByRole('checkbox', { name: /Carving/ })).toBeDisabled();
		await expect.element(page.getByText(m.albums.closing.states.present)).toBeVisible();
	});

	it('shows the error', async () => {
		renderStep({ error: 'Network down' });

		await expect.element(page.getByText('Network down')).toBeVisible();
	});
});
