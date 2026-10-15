import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/index.ts';
import { setTheme } from '#lib/theme/theme.svelte.ts';
import AtelierLayout from './AtelierLayout.svelte';

const navigation = vi.hoisted(() => ({ to: null as object | null }));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	navigating: navigation,
	page: { url: new URL('http://localhost/atelier') }
}));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function snippet(html: string): ReturnType<typeof createRawSnippet> {
	return createRawSnippet(() => ({ render: () => html }));
}

const views = {
	empty: undefined,
	link: snippet('<a href="/atelier">Atelier</a>'),
	tall: snippet('<div style="height: 120px">Tall</div>')
};

function renderLayout(bar: ReturnType<typeof createRawSnippet> | undefined): void {
	render(AtelierLayout, {
		title: 'Atelier',
		email: 'learner@example.com',
		bar,
		children: snippet('<p>Content</p>')
	});
}

describe('AtelierLayout', () => {
	beforeEach(() => {
		navigation.to = null;
	});

	afterEach(() => {
		setTheme('dark');
	});

	it('shows no loading indicator while no navigation is in progress', async () => {
		renderLayout(views.empty);

		await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument();
		await expect.element(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
	});

	it('shows a loading indicator under the top bar while a navigation is in progress', async () => {
		navigation.to = {};
		renderLayout(views.empty);

		await expect.element(page.getByRole('banner').getByRole('progressbar')).toBeInTheDocument();
		await expect.element(page.getByRole('main')).toHaveAttribute('aria-busy', 'true');
	});

	for (const [name, width, height] of [
		['a computer', 1280, 800],
		['a phone', 390, 844]
	] as const) {
		it(`keeps the top bar at one height whatever the view puts in it on ${name}`, async () => {
			await page.viewport(width, height);

			for (const bar of Object.values(views)) renderLayout(bar);
			const heights = page
				.getByRole('banner')
				.elements()
				.map((bar) => bar.getBoundingClientRect().height);

			expect(heights).toHaveLength(3);
			expect(new Set(heights).size).toBe(1);
			expect(heights[0]).toBeGreaterThan(0);
		});
	}

	it('fits the opened menu to the phone viewport and locks the page behind it', async () => {
		await page.viewport(390, 844);
		renderLayout(views.empty);

		await userEvent.click(page.getByRole('button', { name: m.menu.open }));
		const drawer = page.getByRole('dialog').element();

		expect(drawer.getBoundingClientRect().height).toBe(window.innerHeight);
		expect(drawer.scrollHeight).toBe(drawer.clientHeight);
		expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
	});

	it('switches between the dark and the light theme from the menu, between the trash and signing out', async () => {
		await page.viewport(1280, 800);
		renderLayout(views.empty);

		const items = page
			.getByRole('navigation', { name: m.menu.label })
			.element()
			.querySelectorAll('a, button');
		const names = [...items].map((item) => item.textContent?.trim());
		expect(names.slice(-3)).toEqual([m.menu.trash, m.menu.lightTheme, m.menu.signOut]);

		await userEvent.click(page.getByRole('button', { name: m.menu.lightTheme }));

		expect(document.documentElement.dataset.theme).toBe('light');
		await expect.element(page.getByRole('button', { name: m.menu.darkTheme })).toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: m.menu.darkTheme }));

		expect(document.documentElement.dataset.theme).toBeUndefined();
		await expect.element(page.getByRole('button', { name: m.menu.lightTheme })).toBeInTheDocument();
	});
});
