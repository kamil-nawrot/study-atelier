import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import type { NoteLinkSource } from '#lib/notes/types/note-link-source.ts';
import type { NoteLinkTarget } from '#lib/notes/types/note-link-target.ts';

type NoteLinkArgs = {
	artwork_number?: number;
	value_id?: string;
	era_code?: string;
	visit_id?: string;
};

export function noteLinkArgs(subject: NoteLinkSource): NoteLinkArgs {
	if ('artworkNumber' in subject) return { artwork_number: subject.artworkNumber };
	if ('valueId' in subject) return { value_id: subject.valueId };
	if ('eraCode' in subject) return { era_code: subject.eraCode };
	return { visit_id: subject.visitId };
}

export function valueLinkTarget(subject: ValueSubject): NoteLinkTarget {
	return subject.kind === 'era' ? { eraCode: subject.code } : { valueId: subject.record.id };
}
