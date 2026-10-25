import { locale, m } from '#lib/i18n/i18n.ts';
import type { TicketDate } from '#lib/chronicle/types/ticket-date.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

const DAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const MONTH = /^(\d{1,2})\.(\d{4})$/;
const YEAR = /^(\d{4})$/;
const MIN_YEAR = 1000;

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

function isoDate(year: number, month: number, day: number): string {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function realDate(year: number, month: number, day: number): boolean {
	if (year < MIN_YEAR || month < 1 || month > 12 || day < 1) return false;
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseVisitDate(text: string): VisitDate | undefined {
	const value = text.replace(/\s/g, '');
	const day = DAY.exec(value);
	if (day) {
		const [d, mo, y] = day.slice(1).map(Number);
		return realDate(y, mo, d) ? { on: isoDate(y, mo, d), precision: 'day' } : undefined;
	}
	const month = MONTH.exec(value);
	if (month) {
		const [mo, y] = month.slice(1).map(Number);
		return realDate(y, mo, 1) ? { on: isoDate(y, mo, 1), precision: 'month' } : undefined;
	}
	const year = YEAR.exec(value);
	if (year) {
		const y = Number(year[1]);
		return y >= MIN_YEAR ? { on: isoDate(y, 1, 1), precision: 'year' } : undefined;
	}
	return undefined;
}

function parts(date: VisitDate): [number, number, number] {
	const [year, month, day] = date.on.split('-').map(Number);
	return [year, month, day];
}

export function visitYear(date: VisitDate): number {
	return parts(date)[0];
}

export function visitDateText(date: VisitDate): string {
	const [year, month, day] = parts(date);
	if (date.precision === 'year') return String(year);
	if (date.precision === 'month') return `${pad(month)}.${year}`;
	return `${pad(day)}.${pad(month)}.${year}`;
}

function format(date: VisitDate, options: Intl.DateTimeFormatOptions): string {
	const [year, month, day] = parts(date);
	return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
		new Date(Date.UTC(year, month - 1, day))
	);
}

export function ticketDate(date: VisitDate): TicketDate {
	const [year, , day] = parts(date);
	if (date.precision === 'year') return { main: String(year), label: String(year) };
	const monthShort = format(date, { month: 'short' });
	if (date.precision === 'month') {
		return {
			main: monthShort,
			sub: String(year),
			label: format(date, { month: 'long', year: 'numeric' })
		};
	}
	return {
		main: String(day),
		sub: monthShort,
		label: format(date, { day: 'numeric', month: 'long', year: 'numeric' })
	};
}

export function visitDateName(date: VisitDate, now = new Date()): string {
	const [year] = parts(date);
	if (date.precision === 'year') return String(year);
	if (date.precision === 'month') return format(date, { month: 'long', year: 'numeric' });
	const sameYear = year === now.getFullYear();
	return format(date, { day: 'numeric', month: 'long', year: sameYear ? undefined : 'numeric' });
}

export function visitDateFrom(date: VisitDate, now = new Date()): string {
	const [year] = parts(date);
	if (date.precision === 'year') return m.chronicle.inYear(year);
	if (date.precision !== 'month') return visitDateName(date, now);
	const month = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' })
		.formatToParts(new Date(`${date.on}T00:00:00Z`))
		.find((part) => part.type === 'month')?.value;
	return `${month} ${year}`;
}

export function visitWeekday(date: VisitDate): string | undefined {
	return date.precision === 'day' ? format(date, { weekday: 'long' }) : undefined;
}
