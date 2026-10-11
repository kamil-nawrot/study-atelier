<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchField from './SearchField.svelte';

	const { Story } = defineMeta({
		title: 'Components/SearchField',
		component: SearchField,
		tags: ['autodocs'],
		args: { label: 'Search by title', placeholder: 'Search by title' },
		parameters: { layout: 'padded' }
	});
</script>

<Story name="Empty" />

<Story name="With a query" args={{ value: 'Venus' }} />

<Story name="Disabled" args={{ disabled: true }} />
