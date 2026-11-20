export type SearchSelectCreate = {
	label: (query: string) => string;
	onselect: (query: string) => void;
};
