import { untrack } from 'svelte';

export interface Ref<T> {
	current: T;
}

class SvelteRef<T> implements Ref<T> {
	current = $state.raw<T>(undefined!);
	constructor(value?: T) {
		if (value !== undefined) {
			this.current = value;
		}
	}
}

interface CreateRef {
	<T>(): Ref<T | undefined>;
	<T>(fn: () => T): Ref<T>;
	<T>(value: T): Ref<T>;
}

export const createRef: CreateRef = <T>(valueOrFn?: T | (() => T)): Ref<T> => {
	let ref: Ref<T>;
	if (typeof valueOrFn === 'function') {
		const fn = valueOrFn as () => T;
		ref = new SvelteRef<T>(fn());
		$effect.pre(() => {
			const value = fn();
			untrack(() => {
				ref.current = value;
			});
		});
	} else {
		ref = new SvelteRef<T>(valueOrFn);
	}
	return ref;
};
