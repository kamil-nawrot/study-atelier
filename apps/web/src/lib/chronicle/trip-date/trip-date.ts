import { locale, m } from '#lib/i18n/i18n.ts';
import {
	dateFromParts,
	isVisitDate,
	ticketDate,
	visitDateFrom,
	visitDateName
} from '#lib/chronicle/visit-date/visit-date.ts';
import type { DateParts } from '#lib/chronicle/types/date-parts.ts';
import type { TicketDate } from '#lib/chronicle/types/ticket-date.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitDate } from '#lib/chronicle/types/visit-date.ts';

export type TripEndProblem = 'endApproximate' | 'endBeforeStart' | 'yearInvalid' | 'dayInvalid';

type Dated = Pick<Visit, 'date' | 'endsOn'>;

const DAY_MS = 86_400_000;

function utc(iso: string): Date {
	return new Date(`${iso}T00:00:00Z`);
}

export function tripDays(trip: Dated): number | null {
	if (trip.date.precision !== 'day') return null;
	const end = trip.endsOn ?? trip.date.on;
	return Math.round((utc(end).getTime() - utc(trip.date.on).getTime()) / DAY_MS) + 1;
}

export function tripEndFromParts(start: VisitDate, parts: DateParts): string | null | TripEndProblem {
	const [day, month, year] = [parts.day.trim(), parts.month.trim(), parts.year.trim()];
	if (day === '' && month === '' && year === '') return null;
	if (start.precision !== 'day' || day === '') return 'endApproximate';
	const [startYear, startMonth] = start.on.split('-').map(Number);
	const end = dateFromParts({
		day,
		month: month === '' ? String(startMonth) : month,
		year: year === '' ? String(startYear) : year
	});
	if (end === 'yearInvalid' || end === 'dayInvalid') return end;
	if (!isVisitDate(end)) return 'dayInvalid';
	if (end.on < start.on) return 'endBeforeStart';
	return end.on === start.on ? null : end.on;
}

export function isTripEnd(value: string | null | TripEndProblem): value is string | null {
	return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function tripEndParts(trip: Dated): DateParts {
	if (!trip.endsOn) return { day: '', month: '', year: '' };
	const [year, month, day] = trip.endsOn.split('-').map(Number);
	return { day: String(day), month: String(month), year: String(year) };
}

function shortMonth(iso: string): string {
	return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(utc(iso));
}

export function tripDateName(trip: Dated, now = new Date()): string {
	if (!trip.endsOn) return visitDateName(trip.date, now);
	const thisYear = String(now.getFullYear());
	const sameYear = trip.date.on.startsWith(thisYear) && trip.endsOn.startsWith(thisYear);
	return new Intl.DateTimeFormat(locale, {
		day: 'numeric',
		month: 'long',
		year: sameYear ? undefined : 'numeric',
		timeZone: 'UTC'
	}).formatRange(utc(trip.date.on), utc(trip.endsOn));
}

export function tripDateFrom(trip: Dated, now = new Date()): string {
	return trip.endsOn ? tripDateName(trip, now) : visitDateFrom(trip.date, now);
}

export function tripTicketDate(trip: Dated, withYear = true): TicketDate {
	if (!trip.endsOn) return ticketDate(trip.date, withYear);
	const [startYear, startMonth, startDay] = trip.date.on.split('-').map(Number);
	const [endYear, endMonth, endDay] = trip.endsOn.split('-').map(Number);
	const label = tripDateName(trip, new Date(0));
	const from = shortMonth(trip.date.on);
	const to = shortMonth(trip.endsOn);
	let sub = startMonth === endMonth && startYear === endYear ? from : `${from}–${to}`;
	if (withYear) {
		sub = startYear === endYear ? `${sub} ${startYear}` : `${from} ${startYear}–${to} ${endYear}`;
	}
	return { main: `${startDay}–${endDay}`, sub, label };
}

export function tripOverline(trip: Dated): string {
	const days = tripDays(trip);
	return days === null
		? m.chronicle.trip.overlineApproximate(visitDateName(trip.date, new Date(0)))
		: m.chronicle.trip.overline(days);
}
