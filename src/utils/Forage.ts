import { forage } from '@tauri-apps/tauri-forage'

export const setValues = (variable: any, value: any) => {
    forage.setItem({
        key: variable,
        value: value,
      })()
}

export const getValues = (arg: any) => {
    return forage.getItem({key: arg})()
}

export const deleteValues = (key: any) => {
    forage.removeItem(key);
} 