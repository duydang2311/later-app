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
	<T>(value: T): Ref<T>;
}
export const createRef: CreateRef = <T>(value?: T): Ref<T> => {
	return new SvelteRef<T>(value);
};
