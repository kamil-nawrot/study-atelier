import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import FlagButton, { flagAction } from './FlagButton.svelte';

describe('FlagButton', () => {
	it('opens the flag with one click', async () => {
		const onclick = vi.fn();
		render(FlagButton, { onclick });

		await userEvent.click(page.getByRole('button', { name: m.backroom.flag }));

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('says how many flags the item already has', async () => {
		render(FlagButton, { onclick: vi.fn(), count: 2 });

		await expect
			.element(page.getByRole('button', { name: m.backroom.markedCount(2) }))
			.toBeVisible();
	});

	it('gives the same flag to the more actions of a phone', () => {
		const onclick = vi.fn();
		const action = flagAction(onclick);

		action.onclick?.();

		expect(action.label).toBe(m.backroom.flag);
		expect(flagAction(onclick, 1).label).toBe(m.backroom.markedCount(1));
		expect(onclick).toHaveBeenCalledOnce();
	});
});
