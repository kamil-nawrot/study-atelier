import { recordLongLook } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';

export const LONG_LOOK_MS = 60 * 60 * 1000;

let learner: string | undefined;
let recorded = false;

export function followLongLook(owner: string | undefined, known: boolean): void {
	if (owner !== learner) {
		learner = owner;
		recorded = known;
	} else if (known) recorded = true;
}

async function finish(careerShown: boolean): Promise<void> {
	if (recorded) return;
	recorded = true;
	const { error } = await recordLongLook();
	if (error) {
		recorded = false;
		return;
	}
	if (careerShown) await career.refresh();
}

export function watchLongLook(careerShown: boolean): () => void {
	if (recorded) return () => undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const restart = (): void => {
		clearTimeout(timer);
		timer =
			document.visibilityState === 'visible'
				? setTimeout(() => void finish(careerShown), LONG_LOOK_MS)
				: undefined;
	};
	document.addEventListener('visibilitychange', restart);
	restart();
	return () => {
		clearTimeout(timer);
		document.removeEventListener('visibilitychange', restart);
	};
}
