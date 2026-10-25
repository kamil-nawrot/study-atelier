import type { Place } from '#lib/shared/types/place.ts';
import type { Names } from '#lib/shared/types/names.ts';
type PageStop = {
	key: string;
	route: string | null;
};

type Arrival = {
	type: string;
	from: PageStop | null;
	to: PageStop;
	restored?: boolean;
};

const STORAGE_KEY = 'study-atelier:place-names';
const CARRY_ROUTES = new Set(['/(app)/atelier/[number]']);
const FORM_ROUTE = /\/(new|edit)$/;

function isForm(route: string | null): boolean {
	return route !== null && FORM_ROUTE.test(route);
}

function afterForm(current: Place | undefined, to: PageStop): Place | undefined {
	if (!current) return undefined;
	const { previous, ...opener } = current;
	if (opener.path.split('?')[0] !== to.key) return opener;
	return previous && { ...previous, steps: 2 };
}

export function arrive(
	names: Names,
	current: Place | undefined,
	arrival: Arrival
): Place | undefined {
	const { type, from, to, restored } = arrival;
	if (type === 'popstate' || type === 'enter' || !from) return restored ? current : undefined;
	if (isForm(from.route) && type === 'goto') return afterForm(current, to);
	if (from.key === to.key) return current;
	if (from.route === to.route && to.route !== null && CARRY_ROUTES.has(to.route)) return current;
	const place = names[from.key];
	if (!place) return undefined;
	return isForm(to.route) ? { ...place, previous: current } : place;
}

export function named(names: Names, key: string, place: Place): Names {
	const known = names[key];
	if (known?.name === place.name && known.path === place.path) return names;
	return { ...names, [key]: place };
}

export function loadNames(storage?: Pick<Storage, 'getItem'>): Names {
	try {
		const saved = JSON.parse((storage ?? sessionStorage).getItem(STORAGE_KEY) ?? 'null') as unknown;
		return saved !== null && typeof saved === 'object' ? (saved as Names) : {};
	} catch {
		return {};
	}
}

export function saveNames(names: Names, storage?: Pick<Storage, 'setItem'>): void {
	try {
		(storage ?? sessionStorage).setItem(STORAGE_KEY, JSON.stringify(names));
	} catch {
		return;
	}
}
