<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Count from './Count.svelte';

	const { Story } = defineMeta({
		title: 'Components/Count',
		component: Count,
		tags: ['autodocs'],
		args: { value: 12 }
	});
</script>

<Story name="Default" />

<Story name="Outlined" args={{ outlined: true }} />
