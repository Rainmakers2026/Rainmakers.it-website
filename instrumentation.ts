import { SeverityNumber, type Logger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const missingConfiguration = !token ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN' : !host ? 'NEXT_PUBLIC_POSTHOG_HOST' : null;

if (missingConfiguration && process.env.NODE_ENV !== 'production') {
  console.warn(
    `${missingConfiguration} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingConfiguration} is configured`,
  );
}

const posthogLoggerProvider = token && host
  ? new LoggerProvider({
      resource: resourceFromAttributes({ 'service.name': 'rainmakers-web' }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host.replace(/\/$/, '')}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        }),
      ],
    })
  : null;

export const posthogLogger: Logger | null = posthogLoggerProvider?.getLogger('rainmakers-posthog-logs') ?? null;

export { SeverityNumber };

export function register() {
  // The provider is used directly by this integration rather than registering a global logger provider.
}
