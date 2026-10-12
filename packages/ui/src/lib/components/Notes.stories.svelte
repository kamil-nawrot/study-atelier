<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Notes from './Notes.svelte';

	const { Story } = defineMeta({
		title: 'Components/Notes',
		component: Notes,
		tags: ['autodocs']
	});
</script>

<Story
	name="Formatted"
	args={{
		value:
			'### Light\n\nThe light comes from the **left window**, as in most of his *interiors*.\n\n### To remember\n\n- Seen in Delft in 2024\n- Oil on canvas\n\n1. Early work\n2. Mature work'
	}}
/>

<Story
	name="Plain text"
	args={{ value: 'Seen in Delft in 2024.\nThe light comes from the left.' }}
/>

<Story
	name="Unsupported Markdown"
	args={{ value: '[A link](https://example.com)\n\n> A quote\n\n<b>Raw HTML</b>' }}
/>
