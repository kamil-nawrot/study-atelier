import { vi } from 'vitest';
import { beforeNavigate } from '$app/navigation';

export type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

export function leave(
	type: 'link' | 'popstate' | 'leave' = 'link',
	target = 'http://localhost/atelier/trash'
): Leave {
	const navigation = {
		type,
		to: type === 'leave' ? null : { url: new URL(target) },
		delta: type === 'popstate' ? -1 : undefined,
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}
