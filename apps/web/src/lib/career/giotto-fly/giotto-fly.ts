import { recordGiottoFly } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';

export const FLY_CHANCE = 1 / 20;

export type FlySpot = { left: number; top: number; turn: number };

let learner: string | undefined;
let found = false;

export function followGiottoFly(owner: string | undefined, known: boolean): void {
	if (owner !== learner) {
		learner = owner;
		found = known;
	} else if (known) found = true;
}

export function landFly(random: () => number = Math.random): FlySpot | undefined {
	if (found || random() >= FLY_CHANCE) return undefined;
	return {
		left: 20 + random() * 60,
		top: 20 + random() * 60,
		turn: Math.round(random() * 360)
	};
}

export async function swatGiottoFly(careerShown: boolean): Promise<void> {
	if (found) return;
	found = true;
	const { error } = await recordGiottoFly();
	if (error) {
		found = false;
		return;
	}
	if (careerShown) await career.refresh();
}
