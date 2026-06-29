export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[trackEvent] ${name}`, properties);
  }
}
