export interface Db {
	objectStore(name: string, mode: IDBTransactionMode): Promise<IDBObjectStore>;
	get<T>(objectStore: string, key: string): Promise<Entry<T> | undefined>;
	getAll<T>(objectStore: string): Promise<Entry<T>[]>;
	put<T>(objectStore: string, entry: Entry<T>): Promise<void>;
}

interface Entry<T> {
	id: string;
	value: T;
}

class IndexedDb implements Db {
	#promise: Promise<IDBDatabase> | undefined;
	#db: IDBDatabase | undefined;

	public async objectStore(name: string, mode: IDBTransactionMode) {
		const db = await this.getDb();
		const tx = db.transaction(name, mode);
		return tx.objectStore(name);
	}

	public async get<T>(objectStore: string, key: string) {
		const store = await this.objectStore(objectStore, 'readonly');
		const request = store.get(key);
		return new Promise<Entry<T> | undefined>((resolve, reject) => {
			request.onsuccess = () => {
				resolve(request.result as Entry<T> | undefined);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	public async getAll<T>(objectStore: string) {
		const store = await this.objectStore(objectStore, 'readonly');
		const request = store.getAll();
		return new Promise<Entry<T>[]>((resolve, reject) => {
			request.onsuccess = () => {
				resolve(request.result as Entry<T>[]);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	public async put<T>(objectStore: string, entry: Entry<T>) {
		const store = await this.objectStore(objectStore, 'readwrite');
		const request = store.put(entry);
		return new Promise<void>((resolve, reject) => {
			request.onsuccess = () => {
				resolve();
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	private async getDb() {
		if (this.#db) {
			return this.#db;
		}

		if (this.#promise) {
			return this.#promise;
		}

		this.#promise = new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open('later-app', 6);

			request.onupgradeneeded = (event) => {
				const e = event.target as IDBOpenDBRequest;
				const db = (event.target as IDBOpenDBRequest).result;
				switch (event.oldVersion) {
					case 0:
						if (!db.objectStoreNames.contains('preferences')) {
							db.createObjectStore('preferences', { keyPath: 'id' });
						}
					case 1:
						if (!db.objectStoreNames.contains('todos')) {
							db.createObjectStore('todos', { keyPath: 'id' });
						}
					case 2: {
						const store = e.transaction!.objectStore('todos');
						if (!Array.from(store.indexNames).includes(Indexes.byDate)) {
							store.createIndex(Indexes.byDate, 'date', { unique: false });
						}
					}
					case 4: {
						const store = e.transaction!.objectStore('todos');
						store.deleteIndex(Indexes.byDate);
						if (!Array.from(store.indexNames).includes(Indexes.byDate)) {
							store.createIndex(Indexes.byDate, 'value.date', { unique: false });
						}
					}
					case 5: {
						const store = e.transaction!.objectStore('todos');
						store.deleteIndex(Indexes.byDate);
						if (!Array.from(store.indexNames).includes(Indexes.byDateAndTimestamp)) {
							store.createIndex(Indexes.byDateAndTimestamp, ['value.date', 'value.timestamp'], {
								unique: false,
							});
						}
					}
				}
			};

			request.onsuccess = (event) => {
				this.#db = (event.target as IDBOpenDBRequest).result;
				resolve(this.#db);
			};

			request.onerror = (event) => {
				reject((event.target as IDBOpenDBRequest).error);
			};
		});
		return this.#promise;
	}
}

export const Indexes = {
	byDate: 'by_date',
	byDateAndTimestamp: 'by_date_and_timestamp',
};

export const createIndexedDb = () => {
	return new IndexedDb();
};
