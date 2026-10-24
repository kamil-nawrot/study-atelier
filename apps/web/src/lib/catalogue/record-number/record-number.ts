const RECORD_NUMBER_DIGITS = 4;

export function formatRecordNumber(number: number): string {
	return `#${String(number).padStart(RECORD_NUMBER_DIGITS, '0')}`;
}

export function parseRecordNumber(text: string): number | null {
	if (!/^\d+$/.test(text)) return null;
	const number = Number(text);
	return Number.isSafeInteger(number) && number > 0 ? number : null;
}
