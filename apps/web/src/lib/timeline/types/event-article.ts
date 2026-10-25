import type { WikipediaArticle } from '#lib/glossary/types/wikipedia-article.ts';
import type { EventDates } from './event-dates.ts';

export type EventArticle = WikipediaArticle & {
	dates: EventDates;
};
