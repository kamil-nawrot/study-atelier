export type ValueSuggestion = {
	kind: 'similar' | 'existing' | 'starter' | 'new';
	name: string;
	note?: string;
};
