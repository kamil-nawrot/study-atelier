import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { goBackThroughHistory } from './history.ts';

const navigation = vi.hoisted(() => ({ to: null as object | null }));

vi.mock('$app/state', () => ({ navigating: navigation }));

function click(): MouseEvent {
	return new MouseEvent('click', { cancelable: true });
}

describe('goBackThroughHistory', () => {
	const go = vi.spyOn(history, 'go');

	beforeEach(() => {
		navigation.to = null;
		go.mockReset().mockImplementation(() => undefined);
	});

	afterEach(() => {
		go.mockReset();
	});

	it('goes back through history when the learner came from the app', () => {
		const event = click();

		goBackThroughHistory(event, true);

		expect(go).toHaveBeenCalledExactlyOnceWith(-1);
		expect(event.defaultPrevented).toBe(true);
	});

	it('goes back past the replaced entry of a saved form', () => {
		goBackThroughHistory(click(), true, 2);

		expect(go).toHaveBeenCalledExactlyOnceWith(-2);
	});

	it('leaves the link to navigate when the learner did not come from the app', () => {
		const event = click();

		goBackThroughHistory(event, false);

		expect(go).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});

	it('does nothing while the previous navigation is still loading, so a second click cannot leave the app', () => {
		navigation.to = {};
		const event = click();

		goBackThroughHistory(event, true);

		expect(go).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});
});
