import { untrack } from 'svelte';
import { page } from '$app/state';
import { arrive, loadNames, named, saveNames, type Place } from './back-places.ts';

let names = $state(loadNames());
let current = $state<Place>();

type Stop = {
	url: URL | null;
	route: { id: string | null };
} | null;

type Navigation = {
	type: string;
	from: Stop;
	to: Stop;
};

export function recordArrival({ type, from, to }: Navigation): void {
	if (!to?.url) return;
	current = arrive(names, current, {
		type,
		from: from?.url ? { key: from.url.pathname, route: from.route.id } : null,
		to: { key: to.url.pathname, route: to.route.id }
	});
}

export function nameCurrentPlace(name: string): void {
	const { pathname, search } = page.url;
	const next = named(
		untrack(() => names),
		pathname,
		{ name, path: `${pathname}${search}` }
	);
	if (next === untrack(() => names)) return;
	names = next;
	saveNames(next);
}

export function currentBackPlace(): Place | undefined {
	return current;
}

export function setBackPlace(place: Place | undefined): void {
	current = place;
}
