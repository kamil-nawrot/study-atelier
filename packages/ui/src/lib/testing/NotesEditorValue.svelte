<script lang="ts">
	import NotesEditor from '../components/NotesEditor.svelte';

	let value = $state('');
</script>

<NotesEditor label="Notes" bind:value />
<output>{JSON.stringify(value)}</output>
