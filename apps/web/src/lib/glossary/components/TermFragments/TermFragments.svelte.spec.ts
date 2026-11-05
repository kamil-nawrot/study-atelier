import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
import TermFragments from './TermFragments.svelte';

const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function fragment(index: number, extra: Partial<TermFragment> = {}): TermFragment {
	return {
		pinId: `pin-${index}`,
		number: index,
		title: `Katedra ${index}`,
		text: `Apsyda ${index}`,
		crop: PIXEL,
		thumbnail: { src: PIXEL, left: -200, top: -325, width: 1000, height: 500 },
		...extra
	};
}

function arrowsShown(): boolean {
	return [...document.querySelectorAll('.arrow')].some(
		(arrow) => getComputedStyle(arrow).display !== 'none'
	);
}

function show(fragments: TermFragment[]): void {
	render(TermFragments, { fragments });
}

describe('TermFragments', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('shows each fragment as a lens with the title and the record number, the pin text as a hint', async () => {
		show([fragment(12)]);

		const link = page.getByRole('link', { name: /Katedra 12/ });
		await expect.element(link).toHaveAttribute('href', '/atelier/12?pin=pin-12');
		await expect.element(link).toHaveAttribute('title', 'Apsyda 12');
		await expect.element(link).toHaveTextContent('#0012');
		expect(document.querySelector('.lens > img')?.getAttribute('src')).toBe(PIXEL);
	});

	it('cuts the view of the pin from the medium image while the pin has no crop', async () => {
		show([fragment(3, { crop: undefined })]);

		await expect.element(page.getByRole('link', { name: /Katedra 3/ })).toBeVisible();
		const view = document.querySelector<HTMLElement>('img.view');
		expect(view?.style.left).toBe('-200%');
		expect(view?.style.top).toBe('-325%');
		expect(view?.style.width).toBe('1000%');
		expect(view?.style.height).toBe('500%');
	});

	it('falls back to the view of the pin when the crop does not load', async () => {
		show([fragment(4, { crop: 'https://storage.invalid/missing.jpg' })]);

		await expect.poll(() => document.querySelector('img.view')).not.toBeNull();
	});

	it('leaves out a hint for a pin without text', async () => {
		show([fragment(5, { text: '' })]);

		await expect
			.element(page.getByRole('link', { name: /Katedra 5/ }))
			.not.toHaveAttribute('title');
	});

	it('scrolls a long strip with the arrows', async () => {
		show(Array.from({ length: 12 }, (_, index) => fragment(index + 1)));

		const back = page.getByRole('button', { name: m.glossary.view.fragmentsBack });
		const forward = page.getByRole('button', { name: m.glossary.view.fragmentsForward });
		await expect.element(back).toBeDisabled();
		await expect.element(forward).toBeEnabled();
		await forward.click();
		await expect.poll(() => document.querySelector('ul')?.scrollLeft ?? 0).toBeGreaterThan(0);
		await expect.element(back).toBeEnabled();
	});

	it('hides the arrows when every fragment fits', async () => {
		show([fragment(1), fragment(2)]);

		await expect.element(page.getByRole('link', { name: /Katedra 2/ })).toBeVisible();
		expect(arrowsShown()).toBe(false);
	});

	it('scrolls sideways on a phone without the arrows', async () => {
		await page.viewport(390, 800);
		show(Array.from({ length: 6 }, (_, index) => fragment(index + 1)));

		await expect.element(page.getByRole('link', { name: /Katedra 1/ })).toBeVisible();
		expect(arrowsShown()).toBe(false);
		const strip = document.querySelector('ul');
		expect((strip?.scrollWidth ?? 0) > (strip?.clientWidth ?? 0)).toBe(true);
	});
});
