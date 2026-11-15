import { recordLegalRead } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';

export const LEGAL_READ_MS = 3 * 60 * 1000;

let learner: string | undefined;
let recorded = false;

async function finish(): Promise<void> {
	if (recorded) return;
	recorded = true;
	const { error } = await recordLegalRead();
	if (error) {
		recorded = false;
		return;
	}
	career.noteWrite();
}

export function watchLegalRead(owner: string | undefined, end: Element): () => void {
	if (owner !== learner) {
		learner = owner;
		recorded = false;
	}
	if (!owner || recorded) return () => undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let long = false;
	let atEnd = false;
	const check = (): void => {
		if (long && atEnd) void finish();
	};
	const restart = (): void => {
		clearTimeout(timer);
		long = false;
		timer =
			document.visibilityState === 'visible'
				? setTimeout(() => {
						long = true;
						check();
					}, LEGAL_READ_MS)
				: undefined;
	};
	const observer = new IntersectionObserver((entries) => {
		atEnd = entries.at(-1)?.isIntersecting ?? atEnd;
		check();
	});
	observer.observe(end);
	document.addEventListener('visibilitychange', restart);
	restart();
	return () => {
		clearTimeout(timer);
		observer.disconnect();
		document.removeEventListener('visibilitychange', restart);
	};
}
