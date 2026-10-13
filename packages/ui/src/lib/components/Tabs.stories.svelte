<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { text } from '../../stories/snippets';
	import Tabs from './Tabs.svelte';

	const { Story } = defineMeta({
		title: 'Components/Tabs',
		component: Tabs,
		tags: ['autodocs'],
		args: {
			label: 'Kinds of values',
			tabs: [
				{ value: 'periods', label: 'Periods and styles' },
				{ value: 'materials', label: 'Materials' },
				{ value: 'authors', label: 'Authors' },
				{ value: 'locations', label: 'Locations' }
			],
			children: text('The list of the selected kind.')
		},
		argTypes: { children: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Second selected" args={{ value: 'materials' }} />
