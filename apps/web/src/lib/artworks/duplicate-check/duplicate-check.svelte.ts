import { type TitleAndAuthors } from '#lib/artworks/duplicates/duplicates.ts';
import { findDuplicates } from '#lib/artworks/duplicates-data/duplicates-data.ts';
import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';

export class DuplicateCheck {
	open = $state(false);
	numbers = $state<number[]>([]);

	#question = pendingAnswer();

	async confirm(artwork: TitleAndAuthors, excludeId?: string): Promise<boolean> {
		const numbers = await findDuplicates(artwork, excludeId);
		if (numbers.length === 0) return true;
		this.numbers = numbers;
		return this.#question.ask(() => (this.open = true));
	}

	answer(proceed: boolean): void {
		this.#question.answer(proceed);
		this.open = false;
	}
}
