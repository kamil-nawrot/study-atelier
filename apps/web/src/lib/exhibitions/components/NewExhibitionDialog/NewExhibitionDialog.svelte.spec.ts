import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import NewExhibitionDialog from './NewExhibitionDialog.svelte';

describe('NewExhibitionDialog', () => {
	it('creates an exhibition under the trimmed title', async () => {
		const oncreate = vi.fn();
		await render(NewExhibitionDialog, { open: true, oncreate });

		await userEvent.type(page.getByLabelText(m.exhibitions.nameLabel), '  Light  ');
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.add }));

		await vi.waitFor(() => expect(oncreate).toHaveBeenCalledWith('Light'));
	});

	it('asks for a title when it is blank', async () => {
		const oncreate = vi.fn();
		await render(NewExhibitionDialog, { open: true, oncreate });

		await userEvent.type(page.getByLabelText(m.exhibitions.nameLabel), '   ');
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.add }));

		await expect.element(page.getByText(m.exhibitions.nameRequired)).toBeInTheDocument();
		expect(oncreate).not.toHaveBeenCalled();
	});

	it('shows the failure of the last attempt', async () => {
		await render(NewExhibitionDialog, { open: true, error: 'Boom', oncreate: vi.fn() });

		await expect.element(page.getByText('Boom')).toBeInTheDocument();
	});
});
