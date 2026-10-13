<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { text } from '../../stories/snippets';
	import Tag from './Tag.svelte';

	const { Story } = defineMeta({
		title: 'Components/Tag',
		component: Tag,
		tags: ['autodocs'],
		args: { children: text('baroque') },
		argTypes: { children: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Removable" args={{ onremove: fn() }} />

<Story name="Remove disabled" args={{ onremove: fn(), removeDisabled: true }} />

<Story name="List">
	{#snippet template()}
		<div style="display: flex; flex-wrap: wrap; gap: var(--spacing-2)">
			<Tag>baroque</Tag>
			<Tag>portrait</Tag>
			<Tag>ultramarine</Tag>
			<Tag>netherlands</Tag>
		</div>
	{/snippet}
</Story>
