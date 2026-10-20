export type TimelineEvent = {
	id: string;
	name: string;
	yearFrom: number | null;
	yearTo: number;
	yearApproximate: boolean;
	description: string;
};

export type TimelineEventDraft = {
	name: string;
	yearFrom: number | null;
	yearTo: number | null;
	yearApproximate: boolean;
	description: string;
};

export type TimelineEventsResult = {
	events: TimelineEvent[];
	error?: string;
};

export type TimelineEventResult = {
	event?: TimelineEvent;
	notFound?: boolean;
	error?: string;
};

export type TimelineEventSaveResult = {
	id?: string;
	error?: string;
};

export type TimelineEventDeleteResult = {
	error?: string;
};
