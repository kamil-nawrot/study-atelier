<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Button from '../Button/Button.svelte';
	import Icon from '../Icon/Icon.svelte';
	import PageHeader from './PageHeader.svelte';

	const { Story } = defineMeta({
		title: 'Components/PageHeader',
		component: PageHeader,
		tags: ['autodocs'],
		args: {
			title: 'Kronika',
			lead: 'Wizyty w muzeach i miejscach, w których oglądasz dzieła na żywo.'
		}
	});
</script>

<Story name="Title and lead" />

<Story name="With a count">
	{#snippet template(args)}
		<PageHeader {...args}>
			{#snippet aside()}
				<span class="caption">4 wizyty · 12 dzieł</span>
			{/snippet}
		</PageHeader>
	{/snippet}
</Story>

<Story name="With an action">
	{#snippet template(args)}
		<PageHeader {...args}>
			{#snippet actions()}
				<Button aria-label="Filtry">
					<Icon icon={SlidersHorizontal} />
				</Button>
			{/snippet}
		</PageHeader>
	{/snippet}
</Story>
