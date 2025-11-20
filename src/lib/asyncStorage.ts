// AsyncStorage-like API using localStorage with JSON serialization
const PREFIX = 'postup_';

export const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return Promise.all(
      keys.map(async (key) => {
        const value = await this.getItem(key);
        return [key, value] as [string, string | null];
      })
    );
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    await Promise.all(
      keyValuePairs.map(([key, value]) => this.setItem(key, value))
    );
  },

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
    }
  }
};

// Cache helper functions
export const CacheHelper = {
  async saveProfile(userId: string, profile: any) {
    await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
  },

  async getProfile(userId: string) {
    const data = await AsyncStorage.getItem(`profile_${userId}`);
    return data ? JSON.parse(data) : null;
  },

  async saveFeed(feed: any[]) {
    await AsyncStorage.setItem('feed_cache', JSON.stringify(feed));
    await AsyncStorage.setItem('feed_timestamp', Date.now().toString());
  },

  async getFeed() {
    const data = await AsyncStorage.getItem('feed_cache');
    const timestamp = await AsyncStorage.getItem('feed_timestamp');
    
    if (!data || !timestamp) return null;
    
    // Cache expires after 5 minutes
    if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) return null;
    
    return JSON.parse(data);
  },

  async saveChats(chats: any[]) {
    await AsyncStorage.setItem('chats_cache', JSON.stringify(chats));
    await AsyncStorage.setItem('chats_timestamp', Date.now().toString());
  },

  async getChats() {
    const data = await AsyncStorage.getItem('chats_cache');
    const timestamp = await AsyncStorage.getItem('chats_timestamp');
    
    if (!data || !timestamp) return null;
    
    // Cache expires after 2 minutes
    if (Date.now() - parseInt(timestamp) > 2 * 60 * 1000) return null;
    
    return JSON.parse(data);
  },

  async saveMessages(chatId: string, messages: any[]) {
    await AsyncStorage.setItem(`messages_${chatId}`, JSON.stringify(messages));
    await AsyncStorage.setItem(`messages_${chatId}_timestamp`, Date.now().toString());
  },

  async getMessages(chatId: string) {
    const data = await AsyncStorage.getItem(`messages_${chatId}`);
    const timestamp = await AsyncStorage.getItem(`messages_${chatId}_timestamp`);
    
    if (!data || !timestamp) return null;
    
    // Cache expires after 1 minute
    if (Date.now() - parseInt(timestamp) > 60 * 1000) return null;
    
    return JSON.parse(data);
  }
};
