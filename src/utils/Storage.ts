import { Stronghold, Location } from 'tauri-plugin-stronghold-api/webview-dist' ;

const stronghold = new Stronghold('./.bupaku', 'password');
const store = stronghold.getStore('BupakuStore', []);
let location: Location;

export const saveValue = async (key: any, value: any) => {
    location = Location.generic(key, key);
	await store.insert(location, value)
	await stronghold.save()
};
	
export const getValue = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.get(location)
		.then((value: any) => resolve(value))
		.catch((value: any) => reject(value))
});

export const deleteValue = (key: string) => new Promise((resolve, reject) => {
    location = Location.generic(key, key);
    store.remove(location)
    .then((value: any) => resolve(value))
    .catch((value: any) => reject(value))
});

