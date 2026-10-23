const RAIL_KEY = 'study-atelier:rail-expanded';

function rememberedExpanded(): boolean {
	try {
		return localStorage.getItem(RAIL_KEY) === 'true';
	} catch {
		return false;
	}
}

let expanded = $state(rememberedExpanded());

export function railExpanded(): boolean {
	return expanded;
}

export function setRailExpanded(value: boolean): void {
	expanded = value;
	try {
		if (value) localStorage.setItem(RAIL_KEY, 'true');
		else localStorage.removeItem(RAIL_KEY);
	} catch {
		return;
	}
}
