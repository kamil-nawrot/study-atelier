import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import FixBar from './FixBar.svelte';

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/atelier/1/edit') } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ deleteFlag: vi.fn() }));

const entries = [
	{ key: 'a', path: '/atelier/1/edit', field: 'image' as const, note: 'Blurry' },
	{ key: 'b', path: '/atelier/2/edit', field: 'style' as const, note: 'brak stylu' }
];

describe('FixBar', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		fixSession.clear();
	});

	it('shows the place in the queue and skips to the next item', async () => {
		fixSession.start(entries, 0, true);
		render(FixBar);

		await expect.element(page.getByText(m.backroom.progress(1, 2))).toBeVisible();
		await userEvent.click(page.getByRole('button', { name: m.backroom.skip }));

		await expect.poll(() => vi.mocked(goto).mock.calls[0]?.[0]).toBe('/atelier/2/edit');
	});

	it('is empty for a single fix', async () => {
		fixSession.start(entries, 0, false);
		render(FixBar);

		await expect
			.element(page.getByRole('button', { name: m.backroom.skip }))
			.not.toBeInTheDocument();
	});
});
