export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface MongodbConfig {
  uri: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export interface QwenConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}
