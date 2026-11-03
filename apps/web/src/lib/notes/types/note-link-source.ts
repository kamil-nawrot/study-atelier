import type { NoteLinkTarget } from '#lib/notes/types/note-link-target.ts';

export type NoteLinkSource = NoteLinkTarget | { visitId: string };
