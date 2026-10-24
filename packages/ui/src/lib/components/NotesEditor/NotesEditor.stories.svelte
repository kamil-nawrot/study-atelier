<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { NoteLinks } from '../../note-links/note-links';
	import NotesEditor from './NotesEditor.svelte';

	const sample: NoteLinks = {
		suggest: (trigger, query) =>
			(trigger === '@'
				? [
						{
							href: '/atelier/values/period/renaissance',
							name: 'Renaissance',
							detail: 'Period · early modern'
						},
						{ href: '/atelier/values/author/vermeer', name: 'Johannes Vermeer', detail: 'Author' },
						{ href: '/atelier/values/location/delft', name: 'Delft', detail: 'Location' }
					]
				: [
						{
							href: '/atelier/7',
							name: '#0007 Girl with a Pearl Earring',
							detail: 'Johannes Vermeer'
						},
						{ href: '/atelier/12', name: '#0012 The Milkmaid', detail: 'Johannes Vermeer' }
					]
			).filter((option) => option.name.toLowerCase().includes(query.toLowerCase())),
		resolve: (href) =>
			({
				'/atelier/values/author/vermeer': 'Johannes Vermeer',
				'/atelier/7': '#0007 Girl with a Pearl Earring'
			})[href]
	};

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

<Story
	name="With links"
	args={{
		links: sample,
		hint: 'Type @ for a value or # for an artwork.',
		value:
			'Painted by [Vermeer](/atelier/values/author/vermeer), compare [#0007](/atelier/7). A deleted one stays as text: [Lost](/atelier/values/style/gone).'
	}}
/>
