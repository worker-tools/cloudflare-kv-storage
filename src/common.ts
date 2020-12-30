/**
 * Copyright 2019 Google Inc.
 * Licensed under Apache-2.0.
 * <https://github.com/GoogleChromeLabs/kv-storage-polyfill>
 */
export function throwForDisallowedKey(key: any) {
  if (!isAllowedAsAKey(key)) {
    throw Error('kv-storage: The given value is not allowed as a key: ' + key);
  }
}

function isAllowedAsAKey(value: any) {
  if (typeof value === 'number' || typeof value === 'string') {
    return true;
  }

  if (typeof value === 'object' && value) {
    if (Array.isArray(value)) {
      return true;
    }

    if (value instanceof Date) {
      return true;
    }

    if (ArrayBuffer.isView(value)) {
      return true;
    }

    if (value instanceof ArrayBuffer) {
      return true;
    }
  }

  return false;
}
