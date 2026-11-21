import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import TimelineArtworkPreview from './TimelineArtworkPreview.svelte';

const altarpiece = testArtwork(7, 'Altarpiece');

describe('TimelineArtworkPreview', () => {
	it('links the artwork to its page and keeps open while the pointer is on it', async () => {
		const onkeep = vi.fn();
		const onleave = vi.fn();
		render(TimelineArtworkPreview, {
			artwork: altarpiece,
			date: '1450–1520',
			style: 'left: 0; top: 0; width: 176px',
			imageHeight: 120,
			onkeep,
			onleave
		});

		const preview = page.getByRole('group', { name: 'Altarpiece' });
		await expect
			.element(page.getByRole('link', { name: m.timeline.openInAtelier }))
			.toHaveAttribute('href', '/atelier/7');
		await expect.element(preview).toHaveTextContent('1450–1520');

		preview.element().dispatchEvent(new PointerEvent('pointerenter'));
		preview.element().dispatchEvent(new PointerEvent('pointerleave'));
		expect(onkeep).toHaveBeenCalledOnce();
		expect(onleave).toHaveBeenCalledOnce();
	});
});
