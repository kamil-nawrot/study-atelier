import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import FixNote from './FixNote.svelte';

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/atelier/1/edit') } }));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ deleteFlag: vi.fn() }));

describe('FixNote', () => {
	beforeEach(() => {
		fixSession.clear();
	});

	it('shows the reason under the field the editor was opened for', async () => {
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
});
