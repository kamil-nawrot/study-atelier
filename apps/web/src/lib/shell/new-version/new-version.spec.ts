import { describe, expect, it, vi } from 'vitest';
import { loadNewVersion } from './new-version.ts';

function target(): {
	assign: ReturnType<typeof vi.fn<(url: string) => void>>;
	replace: ReturnType<typeof vi.fn<(url: string) => void>>;
} {
	return { assign: vi.fn<(url: string) => void>(), replace: vi.fn<(url: string) => void>() };
}

const to = { url: new URL('https://atelier.test/atelier/glossary') };

describe('loadNewVersion', () => {
	it('lets the navigation go on in the app while the version is the same', () => {
		const location = target();
		expect(loadNewVersion({ to, type: 'link' }, false, location)).toBeUndefined();
		expect(location.assign).not.toHaveBeenCalled();
	});

	it('loads the target page from the server after a new version is out', () => {
		const location = target();
		const waiting = loadNewVersion({ to, type: 'link' }, true, location);
		expect(waiting).toBeInstanceOf(Promise);
		expect(location.assign).toHaveBeenCalledWith('https://atelier.test/atelier/glossary');
	});

	it('keeps a navigation of the app itself, with its state, in the app', () => {
		const location = target();
		expect(loadNewVersion({ to, type: 'goto' }, true, location)).toBeUndefined();
		expect(location.assign).not.toHaveBeenCalled();
		expect(location.replace).not.toHaveBeenCalled();
	});

	it('keeps the history entry when the learner goes back', () => {
		const location = target();
		loadNewVersion({ to, type: 'popstate' }, true, location);
		expect(location.replace).toHaveBeenCalledWith('https://atelier.test/atelier/glossary');
		expect(location.assign).not.toHaveBeenCalled();
	});
});
