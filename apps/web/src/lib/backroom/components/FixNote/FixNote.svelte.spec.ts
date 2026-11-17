import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import type { FormFlags, FormNote } from '#lib/backroom/form-flags/form-flags.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import FixNote from './FixNote.svelte';

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/atelier/1/edit') } }));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ deleteFlag: vi.fn() }));

function formFlags(notes: FormNote[]): FormFlags {
	return {
		notes: (field: string) => (field === 'definition' ? notes : []),
		busy: undefined,
		failed: undefined,
		markFixed: vi.fn(),
		undo: vi.fn()
	} as unknown as FormFlags;
}

describe('FixNote', () => {
	beforeEach(() => {
		fixSession.clear();
	});

	it('shows the missing data above the field the editor was opened for', async () => {
		fixSession.start(
			[{ key: 'a', path: '/atelier/1/edit', field: 'note', note: 'Notatka · „Too long”' }],
			0,
			false
		);
		render(FixNote, { field: 'note' });

		await expect.element(page.getByText('Notatka · „Too long”')).toBeVisible();
	});

	it('stays hidden at another field and outside a fix', async () => {
		fixSession.start(
			[{ key: 'a', path: '/atelier/1/edit', field: 'note', note: 'Notatka' }],
			0,
			false
		);
		render(FixNote, { field: 'year' });
		await expect.element(page.getByText('Notatka')).not.toBeInTheDocument();

		fixSession.clear();
		render(FixNote, { field: 'note' });
		await expect.element(page.getByText('Notatka')).not.toBeInTheDocument();
	});

	it('shows every flag of its field with a button to mark it as fixed', async () => {
		const flags = formFlags([
			{ id: 'f1', text: 'Definicja jest niejasna: „Za krótka”', fixed: false },
			{ id: 'f2', text: 'Odpowiedź widać w pytaniu', fixed: false }
		]);
		render(FixNote, { field: 'definition', flags });

		await expect.element(page.getByText('Definicja jest niejasna: „Za krótka”')).toBeVisible();
		await expect.element(page.getByText('Odpowiedź widać w pytaniu')).toBeVisible();
		await page.getByRole('button', { name: m.backroom.markFixed }).first().click();
		expect(flags.markFixed).toHaveBeenCalledWith('f1');
	});

	it('lets a flag marked as fixed come back', async () => {
		const flags = formFlags([{ id: 'f1', text: 'Definicja', fixed: true }]);
		render(FixNote, { field: 'definition', flags });

		await expect.element(page.getByText(m.backroom.markedFixed)).toBeVisible();
		await page.getByRole('button', { name: m.backroom.undo }).click();
		expect(flags.undo).toHaveBeenCalledWith('f1');
	});

	it('leaves the note of the round to the flags of the item', async () => {
		fixSession.start(
			[
				{ key: 'a', path: '/atelier/1/edit', field: 'definition', note: 'Z rundy', flagIds: ['f1'] }
			],
			0,
			false
		);
		render(FixNote, {
			field: 'definition',
			flags: formFlags([{ id: 'f1', text: 'Z bazy', fixed: false }])
		});

		await expect.element(page.getByText('Z bazy')).toBeVisible();
		await expect.element(page.getByText('Z rundy')).not.toBeInTheDocument();
	});
});
