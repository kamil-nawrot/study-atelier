<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { html } from '../../stories/snippets';
	import Section from './Section.svelte';

	const { Story } = defineMeta({
		title: 'Components/Section',
		component: Section,
		tags: ['autodocs'],
		args: {
			children: html(
				'<div><h3 style="margin: 0">My notes</h3><p style="margin: 0">A tronie, not a portrait: a study of a head in an exotic turban. Ultramarine from lapis lazuli cost more than gold.</p></div>'
			)
		},
		argTypes: {
			as: { control: 'select', options: ['section', 'article', 'aside', 'div'] },
			children: { control: false }
		}
	});
</script>

<Story name="Notes" />
