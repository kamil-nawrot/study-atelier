import {
	isTextKind,
	type NewBlock
} from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export const BLOCK_MIME = 'application/x-exhibition-block';

export function payloadOf(event: DragEvent): NewBlock | undefined {
	const raw = event.dataTransfer?.getData(BLOCK_MIME);
	if (!raw) return undefined;
	try {
		const payload = JSON.parse(raw) as { kind?: string; artworkId?: string };
		if (payload.kind === 'artwork' && typeof payload.artworkId === 'string') {
			return { kind: 'artwork', artworkId: payload.artworkId };
		}
		return payload.kind && isTextKind(payload.kind) ? { kind: payload.kind } : undefined;
	} catch {
		return undefined;
	}
}
