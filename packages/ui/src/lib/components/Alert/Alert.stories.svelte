<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { text } from '../../../stories/snippets';
	import Alert from './Alert.svelte';

	const { Story } = defineMeta({
		title: 'Components/Alert',
		component: Alert,
		tags: ['autodocs'],
		args: { tone: 'danger' },
		argTypes: {
			tone: { control: 'inline-radio', options: ['danger', 'warning', 'success'] },
			children: { control: false }
		}
	});
</script>

<Story
	name="Danger"
	args={{
		title: 'Could not sign in',
		children: text('Wrong email or password. Check both fields or reset your password.')
	}}
/>

<Story
	name="Warning"
	args={{
		tone: 'warning',
		title: 'Image not found',
		children: text('Wikimedia Commons has no image for this artwork. You can upload your own.')
	}}
/>

<Story
	name="Success"
	args={{
		tone: 'success',
		title: 'We sent you a link',
		children: text('Open it to confirm your account. The link is valid for 24 hours.')
	}}
/>

<Story
	name="Custom label"
	args={{ tone: 'danger', label: 'Błąd', title: 'Nie udało się zalogować' }}
/>
