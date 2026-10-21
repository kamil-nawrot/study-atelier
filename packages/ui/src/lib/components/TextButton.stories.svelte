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

<Story name="Inline">
	<p>Na podstawie: Wikipedia, „Tympanon”, CC BY-SA 4.0</p>
	<TextButton inline>Wybierz inny artykuł</TextButton>
</Story>

<Story name="Disabled">
	<TextButton disabled>Collapse all</TextButton>
</Story>
