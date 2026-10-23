import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/index.ts';
import { setTheme } from '#lib/theme/theme.svelte.ts';
import AtelierLayout from './AtelierLayout.svelte';

const navigation = vi.hoisted(() => ({ to: null as object | null }));
const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier'),
	data: {} as {
		reviewWaiting?: Promise<number>;
		menuProfile?: Promise<{ displayName: string | null; avatarPath: string | null } | undefined>;
	}
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({
	navigating: navigation,
	page: pageState
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
		pageState.data = {};
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

	it('puts the glossary after the card index and the timeline before the reviews, and marks the glossary on its pages', async () => {
		await page.viewport(1280, 800);
		pageState.url = new URL('http://localhost/atelier/glossary/some-entry');
		renderLayout(views.empty);

		const links = page
			.getByRole('navigation', { name: m.menu.label })
			.element()
			.querySelectorAll('a');
		const names = [...links].map((link) => link.textContent?.trim() ?? '');

		expect(names.slice(1, 6)).toEqual([
			m.menu.atelier,
			m.menu.cardIndex,
			m.menu.glossary,
			m.menu.timeline,
			m.menu.review
		]);
		await expect
			.element(page.getByRole('link', { name: m.menu.timeline }))
			.toHaveAttribute('href', '/atelier/timeline');
		await expect
			.element(page.getByRole('link', { name: m.menu.glossary }))
			.toHaveAttribute('href', '/atelier/glossary');
		await expect
			.element(page.getByRole('link', { name: m.menu.glossary }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: m.menu.cardIndex }))
			.not.toHaveAttribute('aria-current');
		pageState.url = new URL('http://localhost/atelier');
	});

	it('switches between the dark and the light theme from the menu, between the feedback item and signing out', async () => {
		await page.viewport(1280, 800);
		renderLayout(views.empty);

		const items = page
			.getByRole('navigation', { name: m.menu.label })
			.element()
			.querySelectorAll('a, button');
		const names = [...items].map((item) => item.textContent?.trim());
		expect(names.slice(-4)).toEqual([
			m.menu.trash,
			m.menu.feedback,
			m.menu.lightTheme,
			m.menu.signOut
		]);

		await userEvent.click(page.getByRole('button', { name: m.menu.lightTheme }));

		expect(document.documentElement.dataset.theme).toBe('light');
		await expect.element(page.getByRole('button', { name: m.menu.darkTheme })).toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: m.menu.darkTheme }));

		expect(document.documentElement.dataset.theme).toBeUndefined();
		await expect.element(page.getByRole('button', { name: m.menu.lightTheme })).toBeInTheDocument();
	});

	it('links to the reviews between the timeline and the trash, with the number waiting today only in the expanded rail', async () => {
		await page.viewport(1280, 800);
		pageState.data = { reviewWaiting: Promise.resolve(14) };
		renderLayout(views.empty);

		const rail = page.getByRole('navigation', { name: m.menu.label });
		const link = rail.getByRole('link', {
			name: new RegExp(`^${m.menu.review}.*${m.menu.reviewWaiting(14)}$`)
		});
		await expect.element(link).toHaveAttribute('href', '/atelier/review');
		await expect.element(link.getByText('14', { exact: true })).not.toBeVisible();

		await rail.getByRole('button', { name: m.menu.expand }).click();
		await expect.element(link.getByText('14', { exact: true })).toBeVisible();

		const names = [...rail.element().querySelectorAll('a')].map((item) =>
			item.querySelector('.label')?.textContent?.trim()
		);
		expect(names.indexOf(m.menu.timeline) + 1).toBe(
			names.findIndex((name) => name?.startsWith(m.menu.review))
		);
	});

	it('shows no counter when nothing waits today', async () => {
		pageState.data = { reviewWaiting: Promise.resolve(0) };
		renderLayout(views.empty);

		await expect
			.element(
				page
					.getByRole('navigation', { name: m.menu.label })
					.getByRole('link', { name: m.menu.review, exact: true })
			)
			.toBeInTheDocument();
	});

	it('opens the feedback dialog from the menu', async () => {
		await page.viewport(1280, 800);
		renderLayout(views.empty);

		await userEvent.click(page.getByRole('button', { name: m.menu.feedback }));

		await expect.element(page.getByRole('dialog', { name: m.feedback.title })).toBeInTheDocument();
	});
});

describe('AtelierLayout account row', () => {
	beforeEach(async () => {
		navigation.to = null;
		pageState.data = {};
		await page.viewport(1280, 800);
	});

	it('links to the settings with the email until the profile is known', async () => {
		pageState.data = { menuProfile: new Promise(() => {}) };
		renderLayout(views.empty);

		await expect
			.element(
				page.getByRole('link', {
					name: m.menu.settingsLink('learner@example.com', 'learner@example.com')
				})
			)
			.toHaveAttribute('href', '/atelier/settings');
	});

	it('names the settings link after the learner and shows the first letter of the name', async () => {
		pageState.data = { menuProfile: Promise.resolve({ displayName: 'Anna', avatarPath: null }) };
		renderLayout(views.empty);

		const link = page.getByRole('link', {
			name: m.menu.settingsLink('Anna', 'learner@example.com')
		});
		await expect.element(link).toHaveAttribute('href', '/atelier/settings');
		await expect.element(link).toHaveTextContent('A');
	});

	it('falls back to the email when the profile cannot be read', async () => {
		pageState.data = { menuProfile: Promise.resolve(undefined) };
		renderLayout(views.empty);

		await expect
			.element(
				page.getByRole('link', {
					name: m.menu.settingsLink('learner@example.com', 'learner@example.com')
				})
			)
			.toHaveTextContent('L');
	});

	it('marks the settings as the current page on the settings view', async () => {
		pageState.url = new URL('http://localhost/atelier/settings');
		pageState.data = { menuProfile: Promise.resolve(undefined) };
		renderLayout(views.empty);

		await expect
			.element(
				page.getByRole('link', {
					name: m.menu.settingsLink('learner@example.com', 'learner@example.com')
				})
			)
			.toHaveAttribute('aria-current', 'page');
		pageState.url = new URL('http://localhost/atelier');
	});
});
