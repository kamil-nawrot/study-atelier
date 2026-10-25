import { locale, m } from '#lib/i18n/i18n.ts';
import type { DateParts } from '#lib/chronicle/types/date-parts.ts';
import type { DateProblem } from '#lib/chronicle/types/date-problem.ts';
import type { TicketDate } from '#lib/chronicle/types/ticket-date.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

const MIN_YEAR = 1000;
const YEAR = /^\d{4}$/;
const NUMBER = /^\d{1,2}$/;

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

function isoDate(year: number, month: number, day: number): string {
	return `${year}-${pad(month)}-${pad(day)}`;
}

function realDay(year: number, month: number, day: number): boolean {
	const date = new Date(Date.UTC(year, month - 1, day));
	return day >= 1 && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function dateFromParts(parts: DateParts): VisitDate | DateProblem {
	const [day, month, year] = [parts.day.trim(), parts.month.trim(), parts.year.trim()];
	if (year === '') return 'yearMissing';
	if (!YEAR.test(year) || Number(year) < MIN_YEAR) return 'yearInvalid';
	const y = Number(year);
	if (month === '')
		return day === '' ? { on: isoDate(y, 1, 1), precision: 'year' } : 'monthMissing';
	const mo = Number(month);
	if (day === '') return { on: isoDate(y, mo, 1), precision: 'month' };
	const d = Number(day);
	if (!NUMBER.test(day) || !realDay(y, mo, d)) return 'dayInvalid';
	return { on: isoDate(y, mo, d), precision: 'day' };
}

export function isVisitDate(value: VisitDate | DateProblem): value is VisitDate {
	return typeof value !== 'string';
}

export function monthNames(): string[] {
	const format = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
	return Array.from({ length: 12 }, (_, index) =>
		format.format(new Date(Date.UTC(2026, index, 1)))
	);
}

function parts(date: VisitDate): [number, number, number] {
	const [year, month, day] = date.on.split('-').map(Number);
	return [year, month, day];
}

export function visitYear(date: VisitDate): number {
	return parts(date)[0];
}

export function dateParts(date: VisitDate): DateParts {
	const [year, month, day] = parts(date);
	return {
		day: date.precision === 'day' ? String(day) : '',
		month: date.precision === 'year' ? '' : String(month),
		year: String(year)
	};
}

function format(date: VisitDate, options: Intl.DateTimeFormatOptions): string {
	const [year, month, day] = parts(date);
	return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
		new Date(Date.UTC(year, month - 1, day))
	);
}

export function ticketDate(date: VisitDate, withYear = true): TicketDate {
	const [year, , day] = parts(date);
	const label = visitDateName(date, new Date(0));
	if (date.precision === 'year') return { main: withYear ? String(year) : '', label };
	const monthShort = format(date, { month: 'short' });
	if (date.precision === 'month') {
		return withYear ? { main: monthShort, sub: String(year), label } : { main: monthShort, label };
	}
	return { main: String(day), sub: withYear ? `${monthShort} ${year}` : monthShort, label };
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
