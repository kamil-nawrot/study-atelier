import type { ValueDetails } from '#lib/values/types/value-details.ts';

export function emptyValueDetails(): ValueDetails {
	return { summary: '', notes: '' };
}

export function valueDetailsChanged(a: ValueDetails, b: ValueDetails): boolean {
	return (
		a.summary.trim() !== b.summary.trim() ||
		a.notes !== b.notes ||
		JSON.stringify(a.author ?? null) !== JSON.stringify(b.author ?? null) ||
		JSON.stringify(a.location ?? null) !== JSON.stringify(b.location ?? null)
	);
}
