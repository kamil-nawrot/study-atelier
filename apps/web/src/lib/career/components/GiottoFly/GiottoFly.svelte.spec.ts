import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { followGiottoFly, landFly, swatGiottoFly } from '#lib/career/giotto-fly/giotto-fly.ts';
import { m } from '#lib/i18n/i18n.ts';
import GiottoFly from './GiottoFly.svelte';

const state = vi.hoisted(() => ({
	data: {} as {
		session?: { user: { id: string } };
		giottoFlyRecorded?: boolean;
		careerShown?: boolean;
	}
}));

vi.mock('$app/state', () => ({ page: state }));
vi.mock('#lib/career/giotto-fly/giotto-fly.ts', () => ({
	followGiottoFly: vi.fn(),
	landFly: vi.fn(),
	swatGiottoFly: vi.fn()
}));

const fly = (): ReturnType<typeof page.getByRole> =>
	page.getByRole('button', { name: m.artworkView.swatFly });

describe('GiottoFly', () => {
	beforeEach(() => {
		state.data = {
			session: { user: { id: 'learner' } },
			giottoFlyRecorded: false,
			careerShown: false
		};
		vi.mocked(landFly).mockReset().mockReturnValue({ left: 30, top: 60, turn: 45 });
		vi.mocked(swatGiottoFly).mockReset().mockResolvedValue();
		vi.mocked(followGiottoFly).mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('sits on the image where it landed and follows the learner', async () => {
		render(GiottoFly, { artwork: 'a' });
		await expect.element(fly()).toBeVisible();
		expect(fly().element().getAttribute('style')).toContain('left: 30%');
		expect(followGiottoFly).toHaveBeenCalledWith('learner', false);
	});

	it('shows nothing when the fly did not land', async () => {
		vi.mocked(landFly).mockReturnValue(undefined);
		render(GiottoFly, { artwork: 'a' });
		await expect.element(fly()).not.toBeInTheDocument();
	});

	it('flies off when swatted and records the find', async () => {
		render(GiottoFly, { artwork: 'a' });
		vi.useFakeTimers();
		(fly().element() as HTMLElement).click();
		expect(swatGiottoFly).toHaveBeenCalledWith(false);
		await expect.element(fly()).toBeDisabled();
		await vi.advanceTimersByTimeAsync(600);
		vi.useRealTimers();
		await expect.element(fly()).not.toBeInTheDocument();
	});

	it('lands again on the next artwork', async () => {
		const { rerender } = await render(GiottoFly, { artwork: 'a' });
		await expect.element(fly()).toBeVisible();
		vi.mocked(landFly).mockReturnValue(undefined);
		await rerender({ artwork: 'b' });
		await expect.element(fly()).not.toBeInTheDocument();
		expect(landFly).toHaveBeenCalledTimes(2);
	});
});
