import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

export type PhoneColumns = 1 | 2;

export const DEFAULT_PHONE_COLUMNS: PhoneColumns = 2;

const COLUMNS_KEY = 'study-atelier:wall-columns';

function remembered(): PhoneColumns {
	return readStored('local', COLUMNS_KEY) === '1' ? 1 : DEFAULT_PHONE_COLUMNS;
}

let current = $state<PhoneColumns>(remembered());

export function phoneColumns(): PhoneColumns {
	return current;
}

export function choosePhoneColumns(columns: PhoneColumns): void {
	current = columns;
	writeStored('local', COLUMNS_KEY, columns === DEFAULT_PHONE_COLUMNS ? null : String(columns));
}
