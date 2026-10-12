import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import { emptyCategoryValues } from '#lib/collection/category-values.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { pending, testSession } from '#lib/testing/auth.ts';
import AddArtworkPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() }, rpc: vi.fn() }
}));

const rpcCall = { single: vi.fn() };

function renderPage(): void {
	const values = emptyCategoryValues();
	values.style = ['Delft school'];
	render(AddArtworkPage, { data: { session: testSession(), values }, params: {} });
}

function titleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.title });
}

function authorsField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.authors });
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.artworkForm.save, exact: true });
}

type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

function leave(type: 'link' | 'popstate' | 'leave' = 'link'): Leave {
	const navigation = {
		type,
		to: type === 'leave' ? null : { url: new URL('http://localhost/atelier/trash') },
		delta: type === 'popstate' ? -1 : undefined,
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}

async function fillRequired(): Promise<void> {
	await titleField().fill('The Milkmaid');
	await userEvent.click(authorsField());
	await userEvent.keyboard('Johannes Vermeer{Enter}');
}

describe('add artwork page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-12', record_number: 12 },
			error: null
		});
		await page.viewport(1280, 800);
	});

	it('shows the empty form with the image window and the actions', async () => {
		renderPage();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.artworkForm.newTitle);
		await expect.element(titleField()).toHaveValue('');
		await expect.element(authorsField()).toBeVisible();
		await expect.element(page.getByRole('textbox', { name: m.artworkForm.year })).toBeVisible();
		await expect.element(page.getByRole('textbox', { name: m.artworkForm.notes })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.findImage }))
			.toBeDisabled();
		await expect.element(page.getByText(m.artworkForm.findImageHint)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.cancel }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByRole('link', { name: m.artworkForm.back }))
			.toHaveAttribute('href', '/atelier');
	});

	it('shows field errors on save and moves focus to the first one', async () => {
		renderPage();

		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.titleRequired)).toBeVisible();
		await expect.element(page.getByText(m.artworkErrors.authorRequired)).toBeVisible();
		await expect.element(titleField()).toHaveFocus();
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('rejects a year that is not a whole number', async () => {
		renderPage();
		await fillRequired();

		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1660s');
		await saveButton().click();

		await expect.element(page.getByText(m.artworkErrors.yearInvalid)).toBeVisible();
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('clears and disables the authors when the author is unknown', async () => {
		renderPage();
		await userEvent.click(authorsField());
		await userEvent.keyboard('Johannes Vermeer{Enter}');

		await page.getByText(m.artworkForm.authorUnknown).click();

		await expect.element(authorsField()).toBeDisabled();
		await expect.element(page.getByText('Johannes Vermeer')).not.toBeInTheDocument();
	});

	it('enables the image search once the title and an author are filled in', async () => {
		renderPage();

		await fillRequired();

		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeEnabled();
		await expect.element(page.getByText(m.artworkForm.findImageHint)).not.toBeInTheDocument();
	});

	it('suggests the values already used and the starting list', async () => {
		renderPage();

		await userEvent.click(page.getByRole('combobox', { name: m.artworkForm.style }));

		const options = page.getByRole('listbox').getByRole('option');
		await expect.element(options.first()).toHaveTextContent('Delft school');
		await expect
			.element(page.getByRole('option', { name: m.startingValues.style[0] }))
			.toBeVisible();
	});

	it('saves the artwork and opens the atelier with the new tile highlighted', async () => {
		renderPage();
		await fillRequired();
		await page.getByRole('textbox', { name: m.artworkForm.year }).fill('1658');
		await page.getByText(m.artworkForm.yearApproximate, { exact: true }).click();
		await page
			.getByRole('combobox', { name: m.artworkForm.type })
			.selectOptions(m.artworkTypes.painting);
		await page.getByRole('textbox', { name: m.artworkForm.notes }).fill('Seen in Amsterdam.');

		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier', { state: { highlight: 12 } })
		);
		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: expect.objectContaining({
				title: 'The Milkmaid',
				author_unknown: false,
				year: 1658,
				year_approximate: true,
				type_code: 'painting',
				notes: 'Seen in Amsterdam.'
			}),
			values_by_category: {
				author: ['Johannes Vermeer'],
				period: [],
				style: [],
				material: [],
				location: []
			},
			existing_id: null
		});
	});

	it('shows the running label while saving', async () => {
		rpcCall.single.mockReturnValue(pending());
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByRole('button', { name: m.artworkForm.saving })).toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: m.artworkForm.saveAndNext }))
			.toBeDisabled();
	});

	it('saves and opens an empty form for the next artwork', async () => {
		renderPage();
		await fillRequired();

		await page.getByRole('button', { name: m.artworkForm.saveAndNext }).click();

		await expect.element(titleField()).toHaveValue('');
		await expect.element(titleField()).toHaveFocus();
		await expect.element(page.getByText('Johannes Vermeer')).not.toBeInTheDocument();
		expect(invalidateAll).toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('says when saving failed and lets the learner try again', async () => {
		rpcCall.single.mockResolvedValue({
			data: null,
			error: { code: '', message: 'Failed to fetch' }
		});
		renderPage();
		await fillRequired();

		await saveButton().click();

		await expect.element(page.getByText(m.artworkForm.errorTitle)).toBeVisible();
		await expect.element(saveButton()).toBeEnabled();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		expect(goto).not.toHaveBeenCalled();
	});

	it('leaves without asking when nothing was changed', async () => {
		renderPage();

		const navigation = leave();

		expect(navigation.cancel).not.toHaveBeenCalled();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('asks before discarding changes and stays on the form', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.discardTitle });
		await expect.element(dialog).toBeVisible();
		await dialog.getByRole('button', { name: m.artworkForm.keepEditing }).click();

		await expect.element(dialog).not.toBeInTheDocument();
		await expect.element(titleField()).toHaveValue('The Milkmaid');
		expect(goto).not.toHaveBeenCalled();
	});

	it('continues to the chosen page after the learner discards the changes', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		leave();
		await page.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/trash');
	});

	it('leaves the warning to the browser when the tab is closed', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		const navigation = leave('leave');

		expect(navigation.cancel).toHaveBeenCalled();
		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
	});

	it('asks about unsaved changes before signing out', async () => {
		renderPage();
		await titleField().fill('The Milkmaid');

		await page.getByRole('button', { name: m.menu.signOut }).click();
		const dialog = page.getByRole('alertdialog', { name: m.artworkForm.discardTitle });
		await dialog.getByRole('button', { name: m.artworkForm.keepEditing }).click();

		expect(supabase.auth.signOut).not.toHaveBeenCalled();

		await page.getByRole('button', { name: m.menu.signOut }).click();
		await dialog.getByRole('button', { name: m.artworkForm.discard, exact: true }).click();

		await vi.waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
	});
});
