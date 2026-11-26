export type RowAction = {
	label: string;
	toward: boolean;
	side: 'left' | 'right';
	onclick: () => void;
};
