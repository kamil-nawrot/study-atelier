<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import MetaLine from './MetaLine.svelte';

	const { Story } = defineMeta({
		title: 'Components/MetaLine',
		component: MetaLine,
		tags: ['autodocs'],
		args: { parts: ['Leonardo da Vinci', 'ok. 1503'] }
	});
</script>

<Story name="Default" />

<Story name="From text" args={{ parts: undefined, text: '12 dzieł · zmieniona dziś' }} />

<Story name="Skips empty parts" args={{ parts: ['Vincent van Gogh', null, '', '1889'] }} />
