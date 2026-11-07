import { resolve } from '$app/paths';

const EDIT_PATH = /^\/atelier\/exhibitions\/[0-9a-f-]{36}\?edit$/;

export function returnPathOf(value: string | null | undefined): string | undefined {
	return value && EDIT_PATH.test(value) ? value : undefined;
}

export function addArtworkHref(exhibitionId: string): string {
	const back = `${resolve('/(app)/atelier/exhibitions/[id]', { id: exhibitionId })}?edit`;
	return `${resolve('/(app)/atelier/new')}?return=${encodeURIComponent(back)}`;
}
