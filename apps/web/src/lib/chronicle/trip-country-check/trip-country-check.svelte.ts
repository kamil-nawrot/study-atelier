import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';
import type { TripCountryClash } from '#lib/chronicle/visit-trip/visit-trip.ts';

export class TripCountryCheck {
	open = $state(false);
	clash = $state<TripCountryClash>();

	#question = pendingAnswer();

	confirm(clash: TripCountryClash | undefined): Promise<boolean> {
		if (!clash) return Promise.resolve(true);
		this.clash = clash;
		return this.#question.ask(() => (this.open = true));
	}

	answer(proceed: boolean): void {
		this.#question.answer(proceed);
		this.open = false;
	}
}
