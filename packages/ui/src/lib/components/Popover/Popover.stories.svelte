<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Popover from './Popover.svelte';
	import Tag from '../Tag/Tag.svelte';

	const { Story } = defineMeta({
		title: 'Components/Popover',
		component: Popover,
		tags: ['autodocs'],
		argTypes: { children: { control: false }, content: { control: false } }
	});
</script>

<Story name="Value with a summary">
	{#snippet template()}
		<div style="padding: var(--spacing-8)">
			<Popover>
				<Tag>Renaissance</Tag>
				{#snippet content()}
					<span style="font-size: var(--font-size-xs); text-transform: uppercase">
						Period · early modern
					</span>
					<strong>Renaissance</strong>
					<span>The revival of antiquity in Italy: harmony, proportion and perspective.</span>
				{/snippet}
			</Popover>
		</div>
	{/snippet}
</Story>
