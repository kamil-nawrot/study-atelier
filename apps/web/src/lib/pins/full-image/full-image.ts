import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { MAX_PINS_PER_IMAGE } from '#lib/pins/pin-limits/pin-limits.ts';

export function refreshCareerOnFullImage(pinsOnImage: number, careerShown: boolean): void {
	if (careerShown && pinsOnImage >= MAX_PINS_PER_IMAGE) void career.refresh();
}
