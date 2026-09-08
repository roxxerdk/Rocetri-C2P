export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface MongodbConfig {
  uri: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}
