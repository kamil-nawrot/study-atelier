import { beforeEach, describe, expect, it, vi } from 'vitest';
import { beforeNavigate, goto } from '$app/navigation';
import { guardLeaving } from './leave-guard.svelte.ts';

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));

type Navigation = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

function navigate(type: 'link' | 'popstate' | 'leave'): Navigation {
	const navigation = {
		type,
		to: type === 'leave' ? null : { url: new URL('http://localhost/atelier/values?q=a#top') },
		delta: type === 'popstate' ? -2 : undefined,
		cancel: vi.fn()
	} as unknown as Navigation;
	vi.mocked(beforeNavigate).mock.calls[0][0](navigation);
	return navigation;
}

function guard(blocks: boolean, answer = true, asking = false): ReturnType<typeof vi.fn> {
	const confirm = vi.fn().mockResolvedValue(answer);
	guardLeaving({ blocks: () => blocks, asking: () => asking, confirm });
	return confirm;
}

describe('guardLeaving', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('lets every navigation through while nothing blocks it', () => {
		const confirm = guard(false);

		expect(navigate('link').cancel).not.toHaveBeenCalled();
		expect(navigate('leave').cancel).not.toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
	});

	it('holds a link, asks, and follows it with its query and hash once confirmed', async () => {
		const confirm = guard(true);

		const navigation = navigate('link');

		expect(navigation.cancel).toHaveBeenCalled();
		expect(confirm).toHaveBeenCalledOnce();
		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/atelier/values?q=a#top'));
	});

	it('stays when the learner declines', async () => {
		const confirm = guard(true, false);

		navigate('link');
		await confirm.mock.results[0].value;

		expect(goto).not.toHaveBeenCalled();
	});

	it('goes back through the history for the back button', async () => {
		const go = vi.fn();
		vi.stubGlobal('history', { go });
		guard(true);

		navigate('popstate');

		await vi.waitFor(() => expect(go).toHaveBeenCalledWith(-2));
		vi.unstubAllGlobals();
	});

	it('leaves closing the tab to the browser without asking', () => {
		const confirm = guard(true);

		expect(navigate('leave').cancel).toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
	});

	it('asks only once while a question is open', () => {
		const confirm = guard(true, true, true);

		expect(navigate('link').cancel).toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
	});
});
