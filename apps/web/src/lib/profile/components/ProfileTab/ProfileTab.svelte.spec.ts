import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { TEST_EMAIL } from '#lib/testing/auth/auth.ts';
import { cropAvatar } from '#lib/profile/avatar/avatar.ts';
import { saveProfile } from '#lib/profile/profile-data/profile-data.ts';
import type { Profile } from '#lib/profile/types/profile.ts';
import ProfileTab from './ProfileTab.svelte';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/profile/profile-data/profile-data.ts', () => ({ saveProfile: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/profile/avatar/avatar.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/profile/avatar/avatar.ts')>()),
	avatarUrl: vi.fn().mockResolvedValue(undefined),
	cropAvatar: vi.fn()
}));

const onsaved = vi.fn();

const empty: Profile = {
	displayName: null,
	avatarPath: null,
	rankForm: 'masculine',
	careerShown: true
};
const named: Profile = {
	displayName: 'Anna',
	avatarPath: 'owner/avatar-1.jpg',
	rankForm: 'masculine',
	careerShown: true
};

function renderTab(profile: Profile = empty): void {
	render(ProfileTab, { email: TEST_EMAIL, onsaved, profile });
}

function nameField(): ReturnType<typeof page.getByLabelText> {
	return page.getByLabelText(m.settings.profile.name);
}

function save(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.settings.profile.save });
}

async function choosePhoto(): Promise<void> {
	const input = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('The file input is missing');
	await userEvent.upload(input, new File(['x'], 'me.png', { type: 'image/png' }));
}

describe('ProfileTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		URL.createObjectURL = vi.fn(() => 'blob:preview');
		URL.revokeObjectURL = vi.fn();
	});

	it('leaves the email to the account tab', async () => {
		renderTab(named);

		await expect.element(nameField()).toBeVisible();
		expect(page.getByRole('textbox', { name: /e-mail/i }).elements()).toHaveLength(0);
		expect(page.getByText(TEST_EMAIL).elements()).toHaveLength(0);
	});

	it('shows the photo actions as text buttons', async () => {
		renderTab(named);

		await expect
			.element(page.getByRole('button', { name: m.settings.profile.changePhoto }))
			.toHaveTextContent(m.settings.profile.changePhoto);
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.removePhoto }))
			.toHaveTextContent(m.settings.profile.removePhoto);
	});

	it('shows the saved name and offers to add a photo when there is none', async () => {
		renderTab({ ...empty, displayName: 'Anna' });

		await expect.element(nameField()).toHaveValue('Anna');
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.addPhoto }))
			.toBeVisible();
		expect(
			page.getByRole('button', { name: m.settings.profile.removePhoto }).elements()
		).toHaveLength(0);
	});

	it('offers to change or remove a saved photo', async () => {
		renderTab(named);

		await expect
			.element(page.getByRole('button', { name: m.settings.profile.changePhoto }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.removePhoto }))
			.toBeVisible();
	});

	it('saves the form of the ranks the learner chose', async () => {
		vi.mocked(saveProfile).mockResolvedValue({
			profile: { ...empty, rankForm: 'feminine', careerShown: true }
		});
		renderTab();

		await page.getByLabelText(m.settings.profile.rankForm).selectOptions('feminine');
		await save().click();

		expect(saveProfile).toHaveBeenCalledWith(
			{ name: '', avatar: { kind: 'keep' }, rankForm: 'feminine', careerShown: true },
			expect.anything()
		);
	});

	it('disables the form of the ranks while the rank and the display case are hidden', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...empty, careerShown: false } });
		renderTab();

		const rankForm = page.getByLabelText(m.settings.profile.rankForm);
		await expect.element(rankForm).toBeEnabled();
		await page.getByText(m.settings.profile.careerShown).click();
		await expect.element(rankForm).toBeDisabled();
		await expect.element(page.getByText(m.settings.profile.careerShownHint)).toBeVisible();
		await save().click();

		expect(saveProfile).toHaveBeenCalledWith(
			{ name: '', avatar: { kind: 'keep' }, rankForm: 'masculine', careerShown: false },
			expect.anything()
		);
	});

	it('saves the name and tells the page', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...empty, displayName: 'Ania' } });
		renderTab();

		await nameField().fill('Ania');
		await save().click();

		expect(saveProfile).toHaveBeenCalledWith(
			{ name: 'Ania', avatar: { kind: 'keep' }, rankForm: 'masculine', careerShown: true },
			expect.objectContaining({ displayName: null })
		);
		expect(onsaved).toHaveBeenCalledWith(
			{ ...empty, displayName: 'Ania' },
			m.settings.profile.saved
		);
	});

	it('refuses a name that is too long without calling the server', async () => {
		renderTab();

		await nameField().fill('x'.repeat(61));
		await save().click();

		await expect.element(page.getByText(m.settings.profile.nameTooLong(60))).toBeVisible();
		expect(saveProfile).not.toHaveBeenCalled();
	});

	it('saves a chosen photo cropped by the browser', async () => {
		const image = new Blob(['jpeg'], { type: 'image/jpeg' });
		vi.mocked(cropAvatar).mockResolvedValue({ image });
		vi.mocked(saveProfile).mockResolvedValue({ profile: named });
		renderTab();

		await choosePhoto();
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.changePhoto }))
			.toBeVisible();
		await save().click();

		expect(saveProfile).toHaveBeenCalledWith(
			{ name: '', avatar: { kind: 'replace', image }, rankForm: 'masculine', careerShown: true },
			expect.anything()
		);
	});

	it('says why a photo was refused and keeps the profile as it was', async () => {
		vi.mocked(cropAvatar).mockResolvedValue({ error: m.ownImageErrors.shrinkFailed });
		renderTab();

		await choosePhoto();

		await expect.element(page.getByText(m.ownImageErrors.shrinkFailed)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.addPhoto }))
			.toBeVisible();
	});

	it('removes the saved photo only when the profile is saved', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...named, avatarPath: null } });
		renderTab(named);

		await page.getByRole('button', { name: m.settings.profile.removePhoto }).click();
		expect(saveProfile).not.toHaveBeenCalled();
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.addPhoto }))
			.toBeVisible();
		await save().click();

		expect(saveProfile).toHaveBeenCalledWith(
			{ name: 'Anna', avatar: { kind: 'remove' }, rankForm: 'masculine', careerShown: true },
			expect.anything()
		);
	});

	it('brings back the saved values on cancel', async () => {
		renderTab(named);

		await nameField().fill('Changed');
		await page.getByRole('button', { name: m.settings.profile.removePhoto }).click();
		await page.getByRole('button', { name: m.common.cancel }).click();

		await expect.element(nameField()).toHaveValue('Anna');
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.changePhoto }))
			.toBeVisible();
	});

	it('shows a failed save in an alert and keeps what was typed', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ error: m.settings.profile.failed });
		renderTab();

		await nameField().fill('Ania');
		await save().click();

		await expect
			.element(page.getByRole('alert').filter({ hasText: m.settings.profile.errorTitle }))
			.toHaveTextContent(m.settings.profile.failed);
		await expect.element(nameField()).toHaveValue('Ania');
		expect(onsaved).not.toHaveBeenCalled();
	});

	it('asks before discarding changes and leaves without asking when nothing changed', async () => {
		renderTab();
		const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
		const navigation = {
			type: 'link',
			to: { url: new URL('http://localhost/atelier') },
			cancel: vi.fn()
		};
		type Leave = Parameters<typeof guard>[0];

		guard(navigation as unknown as Leave);
		expect(navigation.cancel).not.toHaveBeenCalled();

		await nameField().fill('Ania');
		guard(navigation as unknown as Leave);

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
		await expect.element(page.getByText(m.common.discardDescription)).toBeVisible();
	});
});
