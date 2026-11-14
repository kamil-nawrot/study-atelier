import { describe, expect, it, vi } from 'vitest';
import {
	currentBackPlace,
	markFormPopped,
	nameCurrentPlace,
	recordArrival
} from './back.svelte.ts';

const state = vi.hoisted(() => ({ url: new URL('http://localhost/atelier/chronicle') }));

vi.mock('$app/state', () => ({
	page: {
		get url() {
			return state.url;
		}
	}
}));

function stop(path: string, id: string): { url: URL; route: { id: string } } {
	return { url: new URL(`http://localhost${path}`), route: { id } };
}

const list = '/(app)/atelier/chronicle';
const view = '/(app)/atelier/chronicle/[id]';
const edit = '/(app)/atelier/chronicle/[id]/edit';

describe('back place after saving a form that popped its history entry', () => {
	it('leads one step back to the list the visit was opened from', () => {
		state.url = new URL('http://localhost/atelier/chronicle');
		nameCurrentPlace('Kronika');
		state.url = new URL('http://localhost/atelier/chronicle/1');
		nameCurrentPlace('Louvre');

		recordArrival({
			type: 'link',
			from: stop('/atelier/chronicle', list),
			to: stop('/atelier/chronicle/1', view)
		});
		recordArrival({
			type: 'link',
			from: stop('/atelier/chronicle/1', view),
			to: stop('/atelier/chronicle/1/edit', edit)
		});
		markFormPopped();
		recordArrival({
			type: 'goto',
			from: stop('/atelier/chronicle/1/edit', edit),
			to: stop('/atelier/chronicle/1', view)
		});

		expect(currentBackPlace()).toEqual({ name: 'Kronika', path: '/atelier/chronicle' });
	});
});
