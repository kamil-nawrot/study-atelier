export type Place = {
	name: string;
	path: string;
};

export type BackState = {
	names: Record<string, Place>;
	back: Record<string, Place>;
};

export type PageStop = {
	key: string;
	route: string | null;
};

export type Arrival = {
	type: string;
	from: PageStop | null;
	to: PageStop;
};

const STORAGE_KEY = 'study-atelier:back-places';
const CARRY_ROUTES = new Set(['/(app)/atelier/[number]']);
const FORM_ROUTE = /\/(new|edit)$/;

export function emptyBackState(): BackState {
	return { names: {}, back: {} };
}

function without(record: Record<string, Place>, key: string): Record<string, Place> {
	return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key));
}

export function arrive(state: BackState, arrival: Arrival): BackState {
	const { type, from, to } = arrival;
	if (type === 'popstate') return state;
	if (!from || type === 'enter') return { ...state, back: without(state.back, to.key) };
	if (from.route && FORM_ROUTE.test(from.route)) return state;
	if (from.key === to.key) return state;
	const carried = from.route === to.route && to.route !== null && CARRY_ROUTES.has(to.route);
	const place = carried ? state.back[from.key] : state.names[from.key];
	return {
		...state,
		back: place ? { ...state.back, [to.key]: place } : without(state.back, to.key)
	};
}

export function named(state: BackState, key: string, place: Place): BackState {
	const known = state.names[key];
	if (known?.name === place.name && known.path === place.path) return state;
	return { ...state, names: { ...state.names, [key]: place } };
}

export function backPlace(state: BackState, key: string): Place | undefined {
	return state.back[key];
}

export function loadBackState(storage: Pick<Storage, 'getItem'> = sessionStorage): BackState {
	try {
		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as BackState | null;
		return saved?.names && saved.back ? saved : emptyBackState();
	} catch {
		return emptyBackState();
	}
}

export function saveBackState(
	state: BackState,
	storage: Pick<Storage, 'setItem'> = sessionStorage
): void {
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		return;
	}
}
