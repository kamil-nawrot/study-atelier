import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { BackroomRow } from '#lib/backroom/types/backroom-row.ts';
import { m } from '#lib/i18n/i18n.ts';
import BackroomList from './BackroomList.svelte';

const rows: BackroomRow[] = [
	{
		kind: 'artwork',
		title: 'Saint Jerome',
		artwork: testArtwork(12, 'Saint Jerome'),
		reason: m.backroom.reasons.image,
		origin: m.backroom.origins.question('Kto jest autorem tego dzieła?'),
		comment: 'Blurry',
		entry: { key: 'flag:1', path: '/atelier/12/edit', field: 'image', note: '', flagIds: ['1'] }
	},
	{
		kind: 'term',
		title: 'Tympanum',
		reason: m.backroom.missing.definition,
		entry: { key: 'missing:t', path: '/atelier/glossary/t/edit', field: 'definition', note: '' }
	}
];

describe('BackroomList', () => {
	it('shows each item with its reason, origin and comment and opens its editor', async () => {
		const onfix = vi.fn();
		render(BackroomList, { rows, onfix });

		await expect.element(page.getByText('Saint Jerome')).toBeVisible();
		await expect.element(page.getByText(m.backroom.reasons.image)).toBeVisible();
		await expect.element(page.getByText('„Blurry”')).toBeVisible();
		await expect.element(page.getByText(m.backroom.missing.definition)).toBeVisible();
		const links = page.getByRole('link', { name: m.backroom.fix });
		await expect.element(links.nth(1)).toHaveAttribute('href', '/atelier/glossary/t/edit');

		links
			.nth(1)
			.element()
			.addEventListener('click', (event) => event.preventDefault());
		await userEvent.click(links.nth(1));

		expect(onfix).toHaveBeenCalledWith(1);
	});

	it('asks for the images that still wait to be found', () => {
		const pending = testArtwork(5, 'Pending', {
			pendingImage: { sourceFile: 'Pending.jpg' } as never
		});
		const onimage = vi.fn();
		render(BackroomList, { rows: [{ ...rows[0], artwork: pending }], onfix: vi.fn(), onimage });

		expect(onimage).toHaveBeenCalledWith(pending);
	});

	it('shows the origin and the hold as tags and marks a flag as fixed', async () => {
		const flag = { id: '1' } as NonNullable<BackroomRow['flag']>;
		const onfixed = vi.fn();
		render(BackroomList, {
			rows: [{ ...rows[0], held: true, flag }, rows[1]],
			onfix: vi.fn(),
			onfixed
		});

		await expect.element(page.getByText(m.backroom.held)).toBeVisible();
		const marks = page.getByRole('button', { name: m.backroom.markFixed });
		await expect.element(marks).toBeVisible();
		await marks.click();

		expect(onfixed).toHaveBeenCalledWith(expect.objectContaining({ flag }));
	});
});
