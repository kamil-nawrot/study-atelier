export const DEFAULT_ERA_JUNCTIONS: readonly number[] = [-3000, 476, 1492, 1789, 1945];

export const PREHISTORY_START = -40000;

const bounds = $state({ junctions: [...DEFAULT_ERA_JUNCTIONS] });

export function validJunctions(junctions: readonly number[] | null | undefined): boolean {
	return (
		Array.isArray(junctions) &&
		junctions.length === DEFAULT_ERA_JUNCTIONS.length &&
		junctions.every(
			(year, index) =>
				Number.isInteger(year) && year > (index === 0 ? PREHISTORY_START : junctions[index - 1])
		)
	);
}

export function applyEraBounds(junctions: readonly number[] | null | undefined): void {
	bounds.junctions = validJunctions(junctions)
		? [...(junctions as number[])]
		: [...DEFAULT_ERA_JUNCTIONS];
}

export function eraJunctions(): readonly number[] {
	return bounds.junctions;
}

export function defaultJunctions(junctions: readonly number[]): boolean {
	return junctions.every((year, index) => year === DEFAULT_ERA_JUNCTIONS[index]);
}
