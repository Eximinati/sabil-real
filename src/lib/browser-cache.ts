'use client';

import localforage from 'localforage';

const lf = localforage.createInstance({
  name: 'sabil-cache',
  version: 1,
  storeName: 'sabil_store',
});

export default lf;
