import { Stronghold, Location } from 'tauri-plugin-stronghold-api'

const stronghold = new Stronghold('./example.stronghold', 'password');
const store = stronghold.getStore('exampleStoreVault', []);
let location: Location;

export const saveValue = async (key: string, value: string) => {
    location = Location.generic(key, key);
	await store.insert(location, value)
	await stronghold.save()
};
	
export const getValue = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.get(location)
		.then(value => resolve(value))
		.catch(value => reject(value))
});

export const Delete = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.remove(location)
    .then(value => resolve(value))
    .catch(value => reject(value))
});

