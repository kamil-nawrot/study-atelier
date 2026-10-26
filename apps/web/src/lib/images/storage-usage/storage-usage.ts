import { locale } from '#lib/i18n/i18n.ts';

const BYTES_IN_MEGABYTE = 1024 * 1024;

export function megabytes(bytes: number): string {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
		bytes / BYTES_IN_MEGABYTE
	);
}
