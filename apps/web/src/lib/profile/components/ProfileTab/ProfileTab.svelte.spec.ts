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

function saveName(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.common.save });
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

	it('has no bar of actions and offers to save the name only once it changes', async () => {
		renderTab(named);

		await expect.element(nameField()).toBeVisible();
		expect(page.getByRole('button', { name: m.common.cancel }).elements()).toHaveLength(0);
		expect(saveName().elements()).toHaveLength(0);
		await nameField().fill('Ania');

		await expect.element(saveName()).toBeVisible();
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

	it('saves the form of the ranks as soon as it is chosen, without a message', async () => {
		vi.mocked(saveProfile).mockResolvedValue({
			profile: { ...empty, rankForm: 'feminine', careerShown: true }
		});
		renderTab();

		await page.getByLabelText(m.settings.profile.rankForm).selectOptions('feminine');

		await vi.waitFor(() =>
			expect(saveProfile).toHaveBeenCalledWith(
				{ name: '', avatar: { kind: 'keep' }, rankForm: 'feminine', careerShown: true },
				expect.anything()
			)
		);
		await vi.waitFor(() =>
			expect(onsaved).toHaveBeenCalledWith({ ...empty, rankForm: 'feminine' }, undefined)
		);
	});

	it('saves the switch of the rank and the display case at once and disables the form of the ranks', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...empty, careerShown: false } });
		renderTab();

		const rankForm = page.getByLabelText(m.settings.profile.rankForm);
		await expect.element(rankForm).toBeEnabled();
		await page.getByText(m.settings.profile.careerShown).click();

		await expect.element(rankForm).toBeDisabled();
		await vi.waitFor(() =>
			expect(saveProfile).toHaveBeenCalledWith(
				{ name: '', avatar: { kind: 'keep' }, rankForm: 'masculine', careerShown: false },
				expect.anything()
			)
		);
	});

	it('keeps a name being typed out of the save of a switch', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...named, careerShown: false } });
		renderTab(named);

		await nameField().fill('Ania');
		await page.getByText(m.settings.profile.careerShown).click();

		await vi.waitFor(() =>
			expect(saveProfile).toHaveBeenCalledWith(
				{ name: 'Anna', avatar: { kind: 'keep' }, rankForm: 'masculine', careerShown: false },
				expect.anything()
			)
		);
		await expect.element(nameField()).toHaveValue('Ania');
	});

	it('saves the name from its button and tells the page', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...empty, displayName: 'Ania' } });
		renderTab();

		await nameField().fill('Ania');
		await saveName().click();

		await vi.waitFor(() =>
			expect(onsaved).toHaveBeenCalledWith(
				{ ...empty, displayName: 'Ania' },
				m.settings.profile.nameSaved
			)
		);
		expect(saveProfile).toHaveBeenCalledWith(
			{ name: 'Ania', avatar: { kind: 'keep' }, rankForm: 'masculine', careerShown: true },
			expect.objectContaining({ displayName: null })
		);
		await expect.element(saveName()).not.toBeInTheDocument();
	});

	it('saves the name with Enter', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...empty, displayName: 'Ania' } });
		renderTab();

		await nameField().fill('Ania');
		await userEvent.type(nameField(), '{Enter}');

		await vi.waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
	});

	it('refuses a name that is too long without calling the server', async () => {
		renderTab();

		await nameField().fill('x'.repeat(61));
		await saveName().click();

		await expect.element(page.getByText(m.settings.profile.nameTooLong(60))).toBeVisible();
		expect(saveProfile).not.toHaveBeenCalled();
	});

	it('saves a chosen photo cropped by the browser at once', async () => {
		const image = new Blob(['jpeg'], { type: 'image/jpeg' });
		vi.mocked(cropAvatar).mockResolvedValue({ image });
		vi.mocked(saveProfile).mockResolvedValue({ profile: named });
		renderTab();

		await choosePhoto();

		await vi.waitFor(() =>
			expect(saveProfile).toHaveBeenCalledWith(
				{ name: '', avatar: { kind: 'replace', image }, rankForm: 'masculine', careerShown: true },
				expect.anything()
			)
		);
		await vi.waitFor(() =>
			expect(onsaved).toHaveBeenCalledWith(named, m.settings.profile.photoSaved)
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
		expect(saveProfile).not.toHaveBeenCalled();
	});

	it('removes the saved photo at once', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ profile: { ...named, avatarPath: null } });
		renderTab(named);

		await page.getByRole('button', { name: m.settings.profile.removePhoto }).click();

		await vi.waitFor(() =>
			expect(saveProfile).toHaveBeenCalledWith(
				{ name: 'Anna', avatar: { kind: 'remove' }, rankForm: 'masculine', careerShown: true },
				expect.anything()
			)
		);
		await vi.waitFor(() =>
			expect(onsaved).toHaveBeenCalledWith(
				{ ...named, avatarPath: null },
				m.settings.profile.photoRemoved
			)
		);
		await expect
			.element(page.getByRole('button', { name: m.settings.profile.addPhoto }))
			.toBeVisible();
	});

	it('shows a failed save in an alert and turns the switch back', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ error: m.settings.profile.failed });
		renderTab();

		await page.getByText(m.settings.profile.careerShown).click();

		await expect
			.element(page.getByRole('alert').filter({ hasText: m.settings.profile.errorTitle }))
			.toHaveTextContent(m.settings.profile.failed);
		await expect
			.element(page.getByRole('switch', { name: m.settings.profile.careerShown }))
			.toBeChecked();
		expect(onsaved).not.toHaveBeenCalled();
	});

	it('keeps a typed name after a failed save', async () => {
		vi.mocked(saveProfile).mockResolvedValue({ error: m.settings.profile.failed });
		renderTab();

		await nameField().fill('Ania');
		await saveName().click();

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.settings.profile.failed);
		await expect.element(nameField()).toHaveValue('Ania');
	});

	it('asks before leaving an unsaved name and leaves without asking when nothing changed', async () => {
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
