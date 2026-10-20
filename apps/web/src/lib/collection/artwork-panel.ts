const PANEL_KEY = 'study-atelier:artwork-panel';
const CLOSED = 'closed';

export function artworkPanelOpen(): boolean {
	try {
		return localStorage.getItem(PANEL_KEY) !== CLOSED;
	} catch {
		return true;
	}
}

export function rememberArtworkPanel(open: boolean): void {
	try {
		if (open) localStorage.removeItem(PANEL_KEY);
		else localStorage.setItem(PANEL_KEY, CLOSED);
	} catch {
		return;
	}
}
