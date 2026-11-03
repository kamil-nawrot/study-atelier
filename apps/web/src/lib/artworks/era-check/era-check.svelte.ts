import { datedOf, sameEraAndYears, yearOutsideEra } from '#lib/artworks/era-fit/era-fit.ts';
import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';

export class EraCheck {
	open = $state(false);

	#question = pendingAnswer();

	ask(input: ArtworkInput, saved?: ArtworkInput): Promise<boolean> {
		const dated = datedOf(input);
		if (!yearOutsideEra(dated) || (saved && sameEraAndYears(dated, datedOf(saved)))) {
			return Promise.resolve(true);
		}
		return this.confirm();
	}

	confirm(): Promise<boolean> {
		return this.#question.ask(() => (this.open = true));
	}

	answer(proceed: boolean): void {
		this.#question.answer(proceed);
		this.open = false;
	}
}
