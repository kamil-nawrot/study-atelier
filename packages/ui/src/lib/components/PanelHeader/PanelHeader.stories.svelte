<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import PanelHeader from './PanelHeader.svelte';

	const { Story } = defineMeta({
		title: 'Components/PanelHeader',
		component: PanelHeader,
		tags: ['autodocs'],
		args: { title: 'Filters', foldLabel: 'Fold filters', onfold: fn() },
		argTypes: {
			as: { control: 'select', options: ['h2', 'p'] }
		}
	});
</script>

<Story name="Heading" />

<Story name="Plain text" args={{ as: 'p', title: 'Details' }} />
