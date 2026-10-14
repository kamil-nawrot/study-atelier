import type { Neighbours, WallSequence } from './types.ts';

const SEQUENCE_KEY = 'study-atelier:wall-sequence';

function isWallSequence(value: unknown): value is WallSequence {
	if (typeof value !== 'object' || value === null) return false;
	const { query, numbers } = value as Record<string, unknown>;
	return (
		typeof query === 'string' &&
		Array.isArray(numbers) &&
		numbers.every((number) => Number.isSafeInteger(number))
	);
}

export function rememberWallSequence(sequence: WallSequence): void {
	try {
		sessionStorage.setItem(SEQUENCE_KEY, JSON.stringify(sequence));
	} catch {
		return;
	}
}

export function rememberedWallSequence(): WallSequence | undefined {
	try {
		const stored = sessionStorage.getItem(SEQUENCE_KEY);
		if (stored === null) return undefined;
		const parsed: unknown = JSON.parse(stored);
		return isWallSequence(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

export function neighboursIn(
	sequence: WallSequence | undefined,
	number: number | null
): Neighbours | undefined {
	if (!sequence || number === null) return undefined;
	const index = sequence.numbers.indexOf(number);
	if (index === -1) return undefined;
	return {
		previous: sequence.numbers[index - 1] ?? null,
		next: sequence.numbers[index + 1] ?? null
	};
}
