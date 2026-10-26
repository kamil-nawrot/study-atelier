export const LEGAL_VERSION = '2026-10-26';

export function legalVersionDate(version: string): string {
	const [year, month, day] = version.split('-');
	return `${day}.${month}.${year}`;
}

export function isCurrentLegalVersion(version: string | null | undefined): boolean {
	return version === LEGAL_VERSION;
}
