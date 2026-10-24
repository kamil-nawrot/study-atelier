<script lang="ts">
	import type { NoteLinks } from '../types/note-links';
	import { untrack } from 'svelte';
	import NotesEditor from '../components/NotesEditor/NotesEditor.svelte';

	type Props = { links?: NoteLinks; initial?: string };

	let { links, initial = '' }: Props = $props();

	let value = $state(untrack(() => initial));
</script>

<NotesEditor label="Notes" {links} bind:value />
<output>{JSON.stringify(value)}</output>
