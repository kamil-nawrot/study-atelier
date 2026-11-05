import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';
import {
	filledFieldsOutsideType,
	withoutFieldsOutsideType
} from '#lib/artworks/artwork-form/artwork-form.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';

export class FieldTypeCheck {
	open = $state(false);
	fields = $state<OwnFieldDefinition[]>([]);

	#question = pendingAnswer();

	ask(fields: OwnFieldDefinition[]): Promise<boolean> {
		if (fields.length === 0) return Promise.resolve(true);
		this.fields = fields;
		return this.#question.ask(() => (this.open = true));
	}

	async confirm(input: ArtworkInput, fields: readonly OwnFieldDefinition[]): Promise<boolean> {
		if (!(await this.ask(filledFieldsOutsideType(input.own, fields, input.typeCode)))) return false;
		if (input.own) input.own = withoutFieldsOutsideType(input.own, fields, input.typeCode);
		return true;
	}

	answer(proceed: boolean): void {
		this.#question.answer(proceed);
		this.open = false;
	}
}
