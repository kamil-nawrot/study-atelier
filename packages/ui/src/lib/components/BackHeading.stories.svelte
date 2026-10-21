<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BackHeading from './BackHeading.svelte';

	const { Story } = defineMeta({
		title: 'Components/BackHeading',
		component: BackHeading,
		tags: ['autodocs'],
		args: { title: 'Nowe dzieło', backLabel: 'Wróć do Atelier', href: '#' }
	});
</script>

<Story name="Default" />

<Story name="Long title" args={{ title: 'Edytuj okres „Renesans północnoeuropejski”' }} />
