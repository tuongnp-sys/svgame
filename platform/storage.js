/**
 * Storage wrapper — localStorage on dev; GamePix.localStorage on portal.
 */
function getBackend() {
  if (typeof GamePix !== 'undefined' && GamePix?.localStorage) {
    return GamePix.localStorage;
  }
  return window.localStorage;
}

export function getCloudStorage() {
  return getBackend();
}

export function storageGet(key, fallback = null) {
  try {
    const raw = getBackend().getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    getBackend().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
