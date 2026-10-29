import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { StepKey } from '#lib/timeline/types/step-key.ts';
import type { TimelineSelection } from '#lib/timeline/types/timeline-selection.ts';
import type { View } from '#lib/timeline/types/view.ts';

export type TimelinePlace = {
	code: EraCode;
	step: StepKey;
	view: View;
	selected: TimelineSelection;
};
