<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import TextButton from './TextButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/TextButton',
		component: TextButton,
		tags: ['autodocs']
	});
</script>

<Story name="Default">
	<TextButton>Collapse all</TextButton>
</Story>

<Story name="Disabled">
	<TextButton disabled>Collapse all</TextButton>
</Story>
