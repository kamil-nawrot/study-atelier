import Trash from '@lucide/svelte/icons/trash-2';
import Columns2 from '@lucide/svelte/icons/columns-2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { ResolvedPathname } from '$app/types';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import MoreActions from './MoreActions.svelte';

const buttons = createRawSnippet(() => ({
	render: () => '<button type="button">Wide delete</button>'
}));
const kept = createRawSnippet(() => ({ render: () => '<a href="/edit">Edit</a>' }));

describe('MoreActions', () => {
	beforeEach(() => {
		document.body.style.paddingLeft = '400px';
	});

	afterEach(() => {
		document.body.style.paddingLeft = '';
	});

	it('keeps its buttons on a larger screen', async () => {
		await page.viewport(1280, 800);
		render(MoreActions, { actions: [], children: buttons, kept });

		await expect.element(page.getByRole('button', { name: 'Wide delete' })).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.common.moreActions }))
			.not.toBeInTheDocument();
	});

	it('gathers the actions under one button on a phone and runs the chosen one', async () => {
		await page.viewport(390, 844);
		const remove = vi.fn();
		render(MoreActions, {
			actions: [
				{ label: 'Compare', icon: Columns2, reason: 'Needs two artworks' },
				{ label: 'Open', icon: Columns2, href: '/atelier/compare' as ResolvedPathname },
				{ label: 'Delete', icon: Trash, onclick: remove, danger: true }
			],
			children: buttons,
			kept
		});

		await expect.element(page.getByRole('link', { name: 'Edit' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Wide delete' })).not.toBeInTheDocument();
		await page.getByRole('button', { name: m.common.moreActions }).click();

		await expect.element(page.getByText('Needs two artworks')).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Open' }))
			.toHaveAttribute('href', '/atelier/compare');
		await page.getByRole('button', { name: 'Delete' }).click();
		expect(remove).toHaveBeenCalledOnce();
		await expect.element(page.getByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
		await page.viewport(1280, 800);
	});
});
