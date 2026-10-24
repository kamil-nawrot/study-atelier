import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';

type WallSequence = {
	query: string;
	numbers: number[];
};

type Neighbours = Record<FlipDirection, number | null>;

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
	writeStored('session', SEQUENCE_KEY, JSON.stringify(sequence));
}

export function rememberedWallSequence(): WallSequence | undefined {
	const stored = readStoredJson('session', SEQUENCE_KEY);
	return isWallSequence(stored) ? stored : undefined;
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
