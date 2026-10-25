import type { TitleAndAuthors } from './title-and-authors.ts';

export type DuplicateCandidate = TitleAndAuthors & {
	id: string;
	number: number;
};
