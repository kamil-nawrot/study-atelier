export const MAX_PINS_PER_IMAGE = 10;
export const MAX_PIN_TEXT = 300;

export type Pin = {
	id: string;
	imageId: string;
	x: number;
	y: number;
	glossaryEntryId: string | null;
	text: string;
};

export type PinDraft = {
	x: number;
	y: number;
	glossaryEntryId: string | null;
	text: string;
};

export type PinsResult = {
	pins: Pin[];
	error?: string;
};

export type PinResult = {
	pin?: Pin;
	error?: string;
};

export type PinActionResult = {
	error?: string;
};

export type EntryPin = {
	artworkId: string;
	pinId: string;
};

export type EntryPinsResult = {
	pins: EntryPin[];
	error?: string;
};
