import { Stronghold, Location } from 'tauri-plugin-stronghold-api' ;

const stronghold = new Stronghold('./bupaku.stronghold', 'password');
const store = stronghold.getStore('exampleStoreVault', []);
let location: Location;

export const saveValue = async (key: any, value: any) => {
    location = Location.generic(key, key);
	await store.insert(location, value)
	await stronghold.save()
};
	
export const getValue = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.get(location)
		.then((value: String) => resolve(value))
		.catch((value: String) => reject(value))
});

export const Delete = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.remove(location)
    .then((value: String) => resolve(value))
    .catch((value: String) => reject(value))
});

