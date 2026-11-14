export type Pin = {
	id: string;
	imageId: string;
	x: number;
	y: number;
	glossaryEntryId: string | null;
	symbolId?: string;
	symbolMeaningId?: string;
	text: string;
	viewWidth?: number;
	cropPath?: string;
};
