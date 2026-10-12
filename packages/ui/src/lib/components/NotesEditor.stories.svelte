<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NotesEditor from './NotesEditor.svelte';

	const { Story } = defineMeta({
		title: 'Components/NotesEditor',
		component: NotesEditor,
		tags: ['autodocs'],
		args: { label: 'Notes' }
	});
</script>

<Story name="Default" args={{ placeholder: 'What to remember about this artwork' }} />

<Story
	name="With value"
	args={{
		value:
			'### Light\n\nThe light comes from the **left window**, as in most of his *interiors*.\n\n- Seen in Delft in 2024\n- Oil on canvas'
	}}
/>

<Story name="With hint" args={{ hint: 'Only you can see your notes.' }} />

<Story
	name="With error"
	args={{ value: 'Too long', error: 'Notes can be at most 2000 characters.' }}
/>

<Story name="Disabled" args={{ value: 'Seen in Delft in 2024.', disabled: true }} />
