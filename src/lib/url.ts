/** Public base URL used in QR codes and emails. Set APP_URL in production. */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
