export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/c2p',
  },
  anthropic: {
    apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  },
});
