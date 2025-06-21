import { ErrorCodes, type ErrorCode } from '$lib/constants/errors';
import { attempt, type Attempt } from '@duydang2311/attempt';
import {
	deleteDB,
	openDB,
	type DBSchema,
	type IDBPDatabase,
	type IDBPTransaction,
	type StoreNames,
} from 'idb';

export interface Db {
	transaction<
		Name extends StoreNames<IndexedDbSchema>,
		Mode extends IDBTransactionMode = 'readonly',
	>(
		storeNames: Name,
		mode?: Mode,
		options?: IDBTransactionOptions
	): Promise<Attempt<IDBPTransaction<IndexedDbSchema, [Name], Mode>, ErrorCode['DB_OPEN_FAILED']>>;
	transaction<
		Names extends ArrayLike<StoreNames<IndexedDbSchema>>,
		Mode extends IDBTransactionMode = 'readonly',
	>(
		storeNames: Names,
		mode?: Mode,
		options?: IDBTransactionOptions
	): Promise<Attempt<IDBPTransaction<IndexedDbSchema, Names, Mode>, ErrorCode['DB_OPEN_FAILED']>>;
	getDb(): Promise<Attempt<IDBPDatabase<IndexedDbSchema>, ErrorCode['DB_OPEN_FAILED']>>;
}

interface IndexedDbSchema extends DBSchema {
	preferences:
		| {
				key: 'bg';
				value: File;
		  }
		| {
				key: 'theme';
				value: string;
		  };
	todos: {
		key: string;
		value: {
			id: string;
			date: string;
			timestamp: number;
			content: string;
			completed: boolean;
		};
		indexes: { by_date_and_timestamp: [string, number] };
	};
}

class IndexedDb implements Db {
	#promise:
		| Promise<Attempt<IDBPDatabase<IndexedDbSchema>, ErrorCode['DB_OPEN_FAILED']>>
		| undefined;
	#db: IDBPDatabase<IndexedDbSchema> | undefined;

	public async transaction<
		Name extends StoreNames<IndexedDbSchema>,
		Mode extends IDBTransactionMode = 'readonly',
	>(
		storeNames: Name,
		mode?: Mode,
		options?: IDBTransactionOptions
	): Promise<Attempt<IDBPTransaction<IndexedDbSchema, [Name], Mode>, ErrorCode['DB_OPEN_FAILED']>>;
	public async transaction<
		Names extends ArrayLike<StoreNames<IndexedDbSchema>>,
		Mode extends IDBTransactionMode = 'readonly',
	>(
		storeNames: Names,
		mode?: Mode,
		options?: IDBTransactionOptions
	): Promise<Attempt<IDBPTransaction<IndexedDbSchema, Names, Mode>, ErrorCode['DB_OPEN_FAILED']>>;
	public async transaction(
		storeNames: StoreNames<IndexedDbSchema> | ArrayLike<StoreNames<IndexedDbSchema>>,
		mode?: IDBTransactionMode,
		options?: IDBTransactionOptions
	): Promise<Attempt<IDBPTransaction<IndexedDbSchema, any, any>, ErrorCode['DB_OPEN_FAILED']>> {
		return attempt.async(async () => {
			const getDb = await this.getDb();
			if (getDb.failed) {
				return getDb;
			}
			return attempt.ok(getDb.data.transaction(storeNames as any, mode, options));
		})((e) => e as never);
	}

	public async getDb() {
		if (this.#db) {
			this.#db.transaction;
			return attempt.ok(this.#db);
		}

		await deleteDB('later-app', {
			blocked: () => {
				console.error(
					'Database deletion is blocked. Please close all other tabs using this database.'
				);
			},
		});
		this.#promise ??= attempt.async(() =>
			openDB<IndexedDbSchema>('later-app', 1, {
				upgrade: (db, oldVersion, _newVersion, transaction, _e) => {
					if (oldVersion < 1) {
						if (!db.objectStoreNames.contains('preferences')) {
							db.createObjectStore('preferences');
						}
						if (!db.objectStoreNames.contains('todos')) {
							db.createObjectStore('todos', { keyPath: 'id' });
						}
						const todosStore = transaction.objectStore('todos');
						todosStore.createIndex(Indexes.byDateAndTimestamp, ['date', 'timestamp'], {
							unique: false,
						});
					}
				},
			})
				.then((a) => {
					this.#db = a;
					return a;
				})
				.finally(() => {
					this.#promise = undefined;
				})
		)(ErrorCodes.DB_OPEN_FAILED);
		return this.#promise;
	}
}

export const Indexes = {
	byDateAndTimestamp: 'by_date_and_timestamp',
} as const;

export const createIndexedDb = () => {
	return new IndexedDb();
};
