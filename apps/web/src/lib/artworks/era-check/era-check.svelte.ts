import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';

export class EraCheck {
	open = $state(false);

	#question = pendingAnswer();

	confirm(): Promise<boolean> {
		return this.#question.ask(() => (this.open = true));
	}

	answer(proceed: boolean): void {
		this.#question.answer(proceed);
		this.open = false;
	}
}
