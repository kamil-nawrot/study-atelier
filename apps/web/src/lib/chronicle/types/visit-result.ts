import type { Visit } from './visit.ts';

export type VisitResult = {
	visit?: Visit;
	notFound?: boolean;
	error?: string;
};
