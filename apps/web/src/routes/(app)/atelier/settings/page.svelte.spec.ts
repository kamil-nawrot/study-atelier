import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidate } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import {
	PREFERENCES_DEPENDENCY,
	savePreferences
} from '#lib/profile/preferences-data/preferences-data.ts';
import { PROFILE_DEPENDENCY, saveProfile } from '#lib/profile/profile-data/profile-data.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import SettingsPage from './+page.svelte';
import '@study-atelier/ui/styles.css';

const navigation = vi.hoisted(() => ({
	state: {} as App.PageState,
	data: {},
	url: new URL('http://localhost/atelier/settings')
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/profile/preferences-data/preferences-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/preferences-data/preferences-data.ts')>()),
	savePreferences: vi.fn()
}));
vi.mock('#lib/profile/profile-data/profile-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/profile-data/profile-data.ts')>()),
	saveProfile: vi.fn()
}));
vi.mock('#lib/profile/avatar/avatar.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/avatar/avatar.ts')>()),
	avatarUrl: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const profile = { displayName: 'Anna', avatarPath: null };

function renderSettings(error?: string, search = '', pendingEmail?: string): void {
	navigation.url = new URL(`http://localhost/atelier/settings${search}`);
	render(SettingsPage, {
		data: {
			session: testSession(),
			profile,
			preferences: defaultPreferences,
			atelierEmpty: true,
			pendingEmail,
			storageUsage: { usedBytes: 9_122_611, quotaBytes: 209_715_200 },
			acceptedLegalVersion: '2026-10-26',
			error
		},
		params: {}
	});
}

describe('settings page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('opens on the profile tab with the title and the lead', async () => {
		renderSettings();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.settings.title);
		await expect.element(page.getByText(m.settings.lead)).toBeVisible();
		await expect
			.element(page.getByRole('tab', { name: m.settings.tabs.profile }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByLabelText(m.settings.profile.name)).toHaveValue('Anna');
	});

	it('opens the tab named in the address', async () => {
		renderSettings(undefined, '?tab=account');

		await expect
			.element(page.getByRole('tab', { name: m.settings.tabs.account }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByText(m.settings.account.passwordTitle)).toBeVisible();
	});

	it('confirms the new address after the return from the last link and drops the mark', async () => {
		renderSettings(undefined, '?tab=account&emailChanged=1');

		await expect.element(page.getByText(m.settings.account.emailChanged)).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/settings?tab=account', {
			replace: true,
			invalidateAll: true
		});
	});

	it('stays silent after the first link while the other one is still to be clicked', async () => {
		renderSettings(undefined, '?tab=account&emailChanged=1', 'new@example.com');

		await expect
			.element(page.getByText(m.settings.account.emailPending('new@example.com')))
			.toBeVisible();
		await expect.element(page.getByText(m.settings.account.emailChanged)).not.toBeInTheDocument();
	});

	it('falls back to the profile tab for a tab it does not know', async () => {
		renderSettings(undefined, '?tab=unknown');

		await expect
			.element(page.getByRole('tab', { name: m.settings.tabs.profile }))
			.toHaveAttribute('aria-selected', 'true');
	});

	it('puts the chosen tab in the address', async () => {
		renderSettings();

		await page.getByRole('tab', { name: m.settings.tabs.account }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/settings?tab=account', {
			replace: true,
			reset: false
		});
	});

	it('refreshes the menu and confirms after the profile is saved', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...profile, displayName: 'Ania' } });
		renderSettings();

		await page.getByLabelText(m.settings.profile.name).fill('Ania');
		await page.getByRole('button', { name: m.settings.profile.save }).click();

		expect(invalidate).toHaveBeenCalledWith(PROFILE_DEPENDENCY);
		await expect.element(page.getByText(m.settings.profile.saved)).toBeVisible();
	});

	it('saves the review preferences and refreshes the menu counter', async () => {
		vi.mocked(savePreferences).mockResolvedValue({
			preferences: { ...defaultPreferences, reviewSessionSize: 30 }
		});
		renderSettings(undefined, '?tab=review');

		await page.getByRole('button', { name: '30' }).click();
		await page.getByRole('button', { name: m.settings.preferences.save }).click();

		expect(savePreferences).toHaveBeenCalledWith(
			'review',
			expect.objectContaining({ reviewSessionSize: 30 })
		);
		expect(invalidate).toHaveBeenCalledWith(PREFERENCES_DEPENDENCY);
		await expect.element(page.getByText(m.settings.preferences.saved)).toBeVisible();
	});

	it('does not save the review preferences without a kind of question', async () => {
		renderSettings(undefined, '?tab=review');

		for (const label of Object.values(m.settings.preferences.kindLabels)) {
			await page.getByText(label).click();
		}
		await page.getByRole('button', { name: m.settings.preferences.save }).click();

		expect(savePreferences).not.toHaveBeenCalled();
		await expect.element(page.getByText(m.settings.preferences.kindsHint)).toHaveClass(/error/);
	});

	it('saves the artwork view preferences', async () => {
		vi.mocked(savePreferences).mockResolvedValue({
			preferences: { ...defaultPreferences, viewShowPins: true }
		});
		renderSettings(undefined, '?tab=view');

		await page.getByRole('switch', { name: m.settings.preferences.showPins }).click();
		await page.getByRole('button', { name: m.settings.preferences.save }).click();

		expect(savePreferences).toHaveBeenCalledWith(
			'view',
			expect.objectContaining({ viewShowPins: true })
		);
	});

	it('opens the data tab with the export', async () => {
		renderSettings(undefined, '?tab=data');

		await expect
			.element(page.getByRole('tab', { name: m.settings.tabs.data }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('button', { name: m.settings.data.exportButton }))
			.toBeVisible();
		await expect
			.element(page.getByRole('meter', { name: m.settings.data.storageUsage('8,7', '200') }))
			.toHaveAttribute('aria-valuenow', '9122611');
	});

	it('saves the switches for the automatic fetching', async () => {
		vi.mocked(savePreferences).mockResolvedValue({
			preferences: { ...defaultPreferences, fetchForms: false }
		});
		renderSettings(undefined, '?tab=sources');

		await page.getByRole('switch', { name: m.settings.preferences.fetchForms }).click();
		await page.getByRole('button', { name: m.settings.preferences.save }).click();

		expect(savePreferences).toHaveBeenCalledWith(
			'sources',
			expect.objectContaining({ fetchForms: false, fetchImage: true })
		);
		expect(invalidate).toHaveBeenCalledWith(PREFERENCES_DEPENDENCY);
	});

	it('shows a load error instead of the tabs', async () => {
		renderSettings(m.settings.profile.failed);

		await expect.element(page.getByText(m.settings.loadErrorTitle)).toBeVisible();
		expect(page.getByRole('tab').elements()).toHaveLength(0);
	});
});
