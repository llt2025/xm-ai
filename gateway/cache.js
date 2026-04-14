// 本地缓存实现
class LocalCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  async get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  async set(key, value, expire = 3600) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + expire * 1000);
    return true;
  }

  async delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    return true;
  }

  async clear() {
    this.cache.clear();
    this.ttl.clear();
    return true;
  }

  async size() {
    return this.cache.size;
  }
}

// 创建缓存实例
export function createCache() {
  return new LocalCache();
}
