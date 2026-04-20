const Storage = (() => {
    const ROOT_KEY = 'cooltab_root';

    function keyToProp(key) {
        if (!key) return key;
        return key.replace(/^cooltab_/, '');
    }

    async function getItem(key) {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
        } catch (err) {
            console.warn('Failed to get item', key, err);
            return null;
        }
    }

    async function setItem(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (err) {
            console.warn('Failed to set item', key, err);
        }
    }

    async function deleteItem(key) {
        try {
            await chrome.storage.local.remove(key);
        } catch (err) {
            console.warn('Failed to delete item', key, err);
        }
    }

    async function readRoot() {
        try {
            const result = await chrome.storage.local.get(ROOT_KEY);
            const data = result[ROOT_KEY];
            return typeof data === 'object' ? data : null;
        } catch (err) {
            console.warn('Failed to read root', err);
            return null;
        }
    }

    async function writeRoot(obj) {
        try {
            await chrome.storage.local.set({ [ROOT_KEY]: obj });
        } catch (err) {
            console.warn('Failed to write root', err);
        }
    }

    async function init() {
        // Initialize chrome.storage.local - no migration needed
        try {
            await chrome.storage.local.get(null);
        } catch (err) {
            console.warn('Failed to initialize storage', err);
        }
    }

    return {
        init,
        get: getItem,
        set: setItem,
        delete: deleteItem,
        getRoot: readRoot,
        setRoot: writeRoot,
        update: async (prop, value) => {
            try {
                const root = (await readRoot()) || {};
                root[prop] = value;
                await writeRoot(root);
            } catch (err) {
                console.warn('Failed to update property', prop, err);
            }
        }
    };
})();
