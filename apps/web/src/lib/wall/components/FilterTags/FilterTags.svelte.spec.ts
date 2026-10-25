import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { filterTags, tagLabel, tagParts } from '#lib/wall/filter-tags/filter-tags.ts';
import { emptyFilter } from '#lib/wall/filter/filter.ts';
import { m } from '#lib/i18n/i18n.ts';
import FilterTags from './FilterTags.svelte';
import '@study-atelier/ui/styles.css';

const tags = filterTags({ ...emptyFilter(), eras: ['modern'], styles: ['Impressionism'] });

describe('FilterTags', () => {
	it('shows nothing without filters', async () => {
		render(FilterTags, { tags: [], onremove: () => {}, onclear: () => {} });

		await expect
			.element(page.getByRole('list', { name: m.atelier.filters.activeLabel }))
			.not.toBeInTheDocument();
	});

	it('lists the filters and the clear button', async () => {
		render(FilterTags, { tags, onremove: () => {}, onclear: () => {} });

		await expect.element(page.getByText(tagLabel(tags[0]))).toBeVisible();
		await expect.element(page.getByText(tagLabel(tags[1]))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.atelier.filters.clear })).toBeVisible();
	});

	it('sets the field apart from its value at a glance', async () => {
		render(FilterTags, { tags, onremove: () => {}, onclear: () => {} });
		const { field, value } = tagParts(tags[0]);

		const fieldStyle = getComputedStyle(page.getByText(field, { exact: true }).element());
		const valueStyle = getComputedStyle(page.getByText(value, { exact: true }).element());

		expect(fieldStyle.color).not.toBe(valueStyle.color);
		expect(fieldStyle.textTransform).toBe('uppercase');
		expect(parseFloat(fieldStyle.fontSize)).toBeLessThan(parseFloat(valueStyle.fontSize));
	});

	it('removes the filter of the tag the learner removes', async () => {
		const onremove = vi.fn();
		render(FilterTags, { tags, onremove, onclear: () => {} });

		await page
			.getByRole('button', { name: m.atelier.filters.removeTag(tagLabel(tags[1])) })
			.click();

		expect(onremove).toHaveBeenCalledExactlyOnceWith(tags[1]);
	});

	it('clears every filter', async () => {
		const onclear = vi.fn();
		render(FilterTags, { tags, onremove: () => {}, onclear });

		await page.getByRole('button', { name: m.atelier.filters.clear }).click();

		expect(onclear).toHaveBeenCalledOnce();
	});
});
