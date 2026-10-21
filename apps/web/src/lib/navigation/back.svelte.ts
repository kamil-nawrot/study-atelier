import { page } from '$app/state';
import {
	arrive,
	backPlace,
	loadBackState,
	named,
	saveBackState,
	type BackState,
	type Place
} from './back-places.ts';

let state = $state<BackState>(loadBackState());

function update(next: BackState): void {
	if (next === state) return;
	state = next;
	saveBackState(next);
}

type Stop = {
	url: URL;
	route: { id: string | null };
} | null;

type Navigation = {
	type: string;
	from: Stop;
	to: Stop;
};

export function recordArrival({ type, from, to }: Navigation): void {
	if (!to) return;
	update(
		arrive(state, {
			type,
			from: from ? { key: from.url.pathname, route: from.route.id } : null,
			to: { key: to.url.pathname, route: to.route.id }
		})
	);
}

export function nameCurrentPlace(name: string): void {
	const { pathname, search } = page.url;
	update(named(state, pathname, { name, path: `${pathname}${search}` }));
}

export function replaceBackState(next: BackState): void {
	update(next);
}

export function currentBackPlace(): Place | undefined {
	return backPlace(state, page.url.pathname);
}
