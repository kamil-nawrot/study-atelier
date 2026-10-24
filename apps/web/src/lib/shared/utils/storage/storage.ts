type Area = 'local' | 'session';

function storageOf(area: Area): Storage {
	return area === 'local' ? localStorage : sessionStorage;
}

export function readStored(area: Area, key: string): string | null {
	try {
		return storageOf(area).getItem(key);
	} catch {
		return null;
	}
}

export function readStoredJson(area: Area, key: string): unknown {
	const stored = readStored(area, key);
	if (stored === null) return null;
	try {
		return JSON.parse(stored) as unknown;
	} catch {
		return null;
	}
}

export function writeStored(area: Area, key: string, value: string | null): void {
	try {
		if (value === null) storageOf(area).removeItem(key);
		else storageOf(area).setItem(key, value);
	} catch {
		return;
	}
}
