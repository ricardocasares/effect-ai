import { Config, Effect, LogLevel } from "effect";

export const AppConfig = Config.all({
  logPretty: Config.boolean("LOG_PRETTY").pipe(Config.withDefault(false)),
  logLevel: Config.logLevel("LOG_LEVEL").pipe(Config.withDefault(LogLevel.Info)),
  openAiApiKey: Config.redacted("OPENAI_API_KEY"),
  openAiApiUrl: Config.string("OPENAI_API_URL").pipe(
    Config.withDefault("https://api.openai.com/v1"),
  ),
  openAiModel: Config.string("OPENAI_MODEL").pipe(Config.withDefault("gpt-4o-mini")),
});

export class ConfigService extends Effect.Service<ConfigService>()("@/ConfigService", {
  effect: AppConfig,
}) {}
