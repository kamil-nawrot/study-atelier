import { recordNightLight } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';

const NIGHT_FROM = 22;
const NIGHT_UNTIL = 6;

let learner: string | undefined;
let recorded = false;

export function isNight(now: Date): boolean {
	const hour = now.getHours();
	return hour >= NIGHT_FROM || hour < NIGHT_UNTIL;
}

export function followNightLight(owner: string | undefined, known: boolean): void {
	if (owner !== learner) {
		learner = owner;
		recorded = known;
	} else if (known) recorded = true;
}

export async function noteLightAtNight(
	careerShown: boolean,
	now: Date = new Date()
): Promise<void> {
	if (recorded || !isNight(now)) return;
	recorded = true;
	const { error } = await recordNightLight();
	if (error) {
		recorded = false;
		return;
	}
	if (careerShown) await career.refresh();
}
