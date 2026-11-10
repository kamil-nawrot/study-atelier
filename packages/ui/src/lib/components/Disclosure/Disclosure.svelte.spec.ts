import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import Disclosure from './Disclosure.svelte';

const content = createRawSnippet(() => ({ render: () => '<p>Group content</p>' }));

describe('Disclosure', () => {
	it('names the group in a heading of the chosen level with its count', async () => {
		render(Disclosure, { title: 'Antiquity', count: 12, level: 3, children: content });

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(/Antiquity\s*12/);
		await expect.element(page.getByText('Group content')).toBeVisible();
	});

	it('writes the count of a room heading in the upright UI font', async () => {
		render(Disclosure, { title: 'Dzieła tego autora', count: 14, room: true, children: content });

		const count = page.getByText('14').element();
		const heading = page.getByRole('heading', { level: 2 }).element();
		expect(getComputedStyle(heading).fontStyle).toBe('italic');
		expect(getComputedStyle(count).fontStyle).toBe('normal');
		expect(getComputedStyle(count).fontFamily).toMatch(/^"?Schibsted Grotesk/);
	});

	it('draws a lazy content only while open and reports a toggle', async () => {
		const ontoggle = vi.fn();
		render(Disclosure, {
			title: 'Antiquity',
			open: false,
			lazy: true,
			ontoggle,
			children: content
		});

		await expect.element(page.getByText('Group content')).not.toBeInTheDocument();

		await page.getByRole('heading', { name: 'Antiquity' }).click();

		await expect.element(page.getByText('Group content')).toBeVisible();
		expect(ontoggle).toHaveBeenLastCalledWith(true);
	});

	it('opens a section of a page like a room, with the chevron at the end of the row', async () => {
		render(Disclosure, { title: 'Relations', room: true, children: content });

		const heading = page.getByRole('heading', { level: 2, name: 'Relations' }).element();
		const summary = heading.closest('summary');
		const chevron = summary?.lastElementChild;

		expect(summary?.closest('details')?.classList.contains('room')).toBe(true);
		expect(chevron?.getBoundingClientRect().right).toBe(summary?.getBoundingClientRect().right);
	});
});
