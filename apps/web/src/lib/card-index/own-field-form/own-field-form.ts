import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';

export function ownFieldDraft(edited?: OwnField): OwnFieldInput {
	if (!edited) {
		return {
			name: '',
			description: '',
			kind: 'text',
			multiple: false,
			closed: false,
			limited: false,
			typeCodes: []
		};
	}
	return {
		name: edited.name,
		description: edited.description ?? '',
		kind: edited.kind,
		multiple: edited.multiple,
		closed: edited.closed,
		limited: edited.typeCodes.length > 0,
		typeCodes: [...edited.typeCodes]
	};
}

export function ownFieldDraftChanged(current: OwnFieldInput, reference: OwnFieldInput): boolean {
	return (
		current.name.trim() !== reference.name.trim() ||
		current.description.trim() !== reference.description.trim() ||
		current.kind !== reference.kind ||
		current.multiple !== reference.multiple ||
		current.closed !== reference.closed ||
		current.limited !== reference.limited ||
		current.typeCodes.join() !== reference.typeCodes.join()
	);
}
