<script lang="ts">
	import NotesEditor from '../components/NotesEditor.svelte';
	import type { NoteLinks } from '../note-links';

	type Props = { links?: NoteLinks; initial?: string };

	let { links, initial = '' }: Props = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initial);
</script>

<NotesEditor label="Notes" {links} bind:value />
<output>{JSON.stringify(value)}</output>
