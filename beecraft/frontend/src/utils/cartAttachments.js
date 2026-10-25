const DB_NAME = 'beecraft-cart-files';
const STORE_NAME = 'attachments';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não permite guardar o PDF.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveCartAttachment(file) {
  const id = crypto.randomUUID();
  await transact('readwrite', (store) => store.put({
    id,
    file,
    name: file.name,
    type: file.type,
    createdAt: new Date().toISOString(),
  }));
  return id;
}

export async function getCartAttachment(id) {
  if (!id) return null;
  const record = await transact('readonly', (store) => store.get(id));
  if (!record?.file) return null;
  return record.file instanceof File
    ? record.file
    : new File([record.file], record.name || 'BeeCraft-projeto.pdf', { type: record.type || 'application/pdf' });
}

export async function deleteCartAttachment(id) {
  if (id) await transact('readwrite', (store) => store.delete(id));
}
