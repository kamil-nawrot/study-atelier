import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { pending } from '#lib/testing/auth/auth.ts';
import { setRailExpanded } from '#lib/shell/rail/rail.svelte.ts';
import { setTheme } from '#lib/shell/theme/theme.svelte.ts';
import AtelierLayout from './AtelierLayout.svelte';

const navigation = vi.hoisted(() => ({ to: null as object | null }));
const version = vi.hoisted(() => ({ current: false }));
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
	page: pageState,
	updated: version
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const signOut = vi.mocked(supabase.auth.signOut);

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
		version.current = false;
	});

	afterEach(() => {
		setTheme('dark');
		setRailExpanded(false);
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

	it('puts the glossary after the card index and the chronicle between the timeline and the reviews, and marks the glossary on its pages', async () => {
		await page.viewport(1280, 800);
		pageState.url = new URL('http://localhost/atelier/glossary/some-entry');
		renderLayout(views.empty);

		const links = page
			.getByRole('navigation', { name: m.menu.label })
			.element()
			.querySelectorAll('a');
		const names = [...links].map((link) => link.textContent?.trim() ?? '');

		expect(names.slice(1, 7)).toEqual([
			m.menu.atelier,
			m.menu.cardIndex,
			m.menu.glossary,
			m.menu.timeline,
			m.menu.chronicle,
			m.menu.review
		]);
		await expect
			.element(page.getByRole('link', { name: m.menu.chronicle }))
			.toHaveAttribute('href', '/atelier/chronicle');
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

	it('links to the reviews between the chronicle and the trash, with the number waiting today only in the expanded rail', async () => {
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
		expect(names.indexOf(m.menu.chronicle) + 1).toBe(
			names.findIndex((name) => name?.startsWith(m.menu.review))
		);
	});

	it('links to the display case right after the reviews', async () => {
		await page.viewport(1280, 800);
		renderLayout(views.empty);

		const rail = page.getByRole('navigation', { name: m.menu.label });
		await expect
			.element(rail.getByRole('link', { name: m.menu.displayCase }))
			.toHaveAttribute('href', '/atelier/display-case');
		const names = [...rail.element().querySelectorAll('a')].map((item) =>
			item.querySelector('.label')?.textContent?.trim()
		);
		expect(names.findIndex((name) => name?.startsWith(m.menu.review)) + 1).toBe(
			names.indexOf(m.menu.displayCase)
		);
	});

	it('keeps the rail expanded in a layout rendered by the next page', async () => {
		await page.viewport(1280, 800);
		const first = await render(AtelierLayout, {
			title: 'Atelier',
			email: 'learner@example.com',
			children: snippet('<p>Content</p>')
		});
		const rail = page.getByRole('navigation', { name: m.menu.label });
		await rail.getByRole('button', { name: m.menu.expand }).click();
		first.unmount();

		renderLayout(views.empty);

		await expect
			.element(rail.getByRole('button', { name: m.menu.collapse }))
			.toHaveAttribute('aria-expanded', 'true');
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

	it('asks to reload once a new version of the app is out', async () => {
		version.current = true;
		renderLayout(views.empty);

		await expect
			.element(page.getByRole('button', { name: m.newVersion.reload }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.newVersion.message)).toBeInTheDocument();
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

	it('shows the name without the email, which stays in the tooltip of the name', async () => {
		pageState.data = { menuProfile: Promise.resolve({ displayName: 'Anna', avatarPath: null }) };
		renderLayout(views.empty);

		await expect
			.element(page.getByText('Anna', { exact: true }))
			.toHaveAttribute('title', 'learner@example.com');
		await expect
			.element(page.getByText('learner@example.com', { exact: true }))
			.not.toBeInTheDocument();
	});

	it('shows the email in place of a name the learner has not given', async () => {
		pageState.data = { menuProfile: Promise.resolve({ displayName: null, avatarPath: null }) };
		renderLayout(views.empty);

		await expect
			.element(page.getByText('learner@example.com', { exact: true }))
			.toBeInTheDocument();
	});

	it('keeps the name while the profile loads again after a navigation', async () => {
		pageState.data = { menuProfile: Promise.resolve({ displayName: 'Anna', avatarPath: null }) };
		const first = await render(AtelierLayout, {
			title: 'Atelier',
			email: 'learner@example.com',
			children: snippet('<p>Content</p>')
		});
		const named = page.getByRole('link', {
			name: m.menu.settingsLink('Anna', 'learner@example.com')
		});
		await expect.element(named).toBeInTheDocument();
		first.unmount();

		pageState.data = { menuProfile: new Promise(() => {}) };
		renderLayout(views.empty);

		await expect.element(named).toBeInTheDocument();
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

describe('AtelierLayout menu', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		navigation.to = null;
		pageState.data = {};
	});

	afterEach(() => {
		setRailExpanded(false);
	});

	describe('on a larger screen', () => {
		beforeEach(async () => {
			await page.viewport(1280, 800);
		});

		it('expands and collapses the side menu', async () => {
			renderLayout(views.empty);

			await page.getByRole('button', { name: m.menu.expand }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.collapse }))
				.toHaveAttribute('aria-expanded', 'true');
			await expect.element(page.getByRole('img', { name: m.app.name })).toBeVisible();

			await page.getByRole('button', { name: m.menu.collapse }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.toHaveAttribute('aria-expanded', 'false');
		});

		it('links to the trash and has no menu icon in the top bar', async () => {
			renderLayout(views.empty);

			await expect
				.element(page.getByRole('link', { name: m.menu.trash }))
				.toHaveAttribute('href', '/atelier/trash');
			await expect.element(page.getByText('learner@example.com')).toBeInTheDocument();
			await expect.element(page.getByRole('button', { name: m.menu.open })).not.toBeInTheDocument();
		});

		it('signs out and returns to sign-in', async () => {
			signOut.mockResolvedValue({ error: null });
			renderLayout(views.empty);

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await vi.waitFor(() =>
				expect(goto).toHaveBeenCalledWith('/sign-in', { invalidateAll: true })
			);
			expect(signOut).toHaveBeenCalledOnce();
		});

		it('disables sign out while signing out', async () => {
			signOut.mockReturnValue(pending());
			renderLayout(views.empty);

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await expect.element(page.getByRole('button', { name: m.menu.signOut })).toBeDisabled();
			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('on a phone', () => {
		beforeEach(async () => {
			await page.viewport(390, 800);
		});

		it('opens the menu from the top bar and closes it', async () => {
			renderLayout(views.empty);

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.not.toBeInTheDocument();

			await page.getByRole('button', { name: m.menu.open }).click();

			const drawer = page.getByRole('dialog', { name: m.menu.label });
			await expect.element(drawer).toBeVisible();
			await expect.element(drawer.getByRole('link', { name: m.menu.trash })).toBeVisible();
			await expect.element(drawer.getByRole('button', { name: m.menu.signOut })).toBeVisible();

			await page.getByRole('button', { name: m.menu.close }).click();

			await expect.element(drawer).not.toBeInTheDocument();
		});
	});
});
