import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

const PANEL_KEY = 'study-atelier:artwork-panel';
const CLOSED = 'closed';

export function artworkPanelOpen(): boolean {
	return readStored('local', PANEL_KEY) !== CLOSED;
}

export function rememberArtworkPanel(open: boolean): void {
	writeStored('local', PANEL_KEY, open ? null : CLOSED);
}
