export default async function handler(req, res) {
  const { POSTHOG_API_KEY, POSTHOG_PROJECT_ID } = process.env;

  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return res
      .status(500)
      .json({ error: "PostHog environment variables not set" });
  }

  const endpoint = `https://us.i.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/query`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${POSTHOG_API_KEY}`,
  };

  async function hogql(query) {
    const r = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`PostHog error ${r.status}: ${text}`);
    }
    return r.json();
  }

  try {
    const [allTimeRes, last7Res, last30Res, last24Res, last48Res, dailyRes] =
      await Promise.all([
        hogql(`SELECT count() FROM events WHERE event = 'file_processed'`),
        hogql(
          `SELECT count() FROM events WHERE event = 'file_processed' AND timestamp >= now() - INTERVAL 7 DAY`,
        ),
        hogql(
          `SELECT count() FROM events WHERE event = 'file_processed' AND timestamp >= now() - INTERVAL 30 DAY`,
        ),
        hogql(
          `SELECT count() FROM events WHERE event = 'file_processed' AND timestamp >= now() - INTERVAL 1 DAY`,
        ),
        hogql(
          `SELECT count() FROM events WHERE event = 'file_processed' AND timestamp >= now() - INTERVAL 2 DAY`,
        ),
        hogql(
          `SELECT toDate(timestamp) AS day, count() AS cnt FROM events WHERE event = 'file_processed' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY day ORDER BY day ASC`,
        ),
      ]);

    const allTime = Number(allTimeRes.results?.[0]?.[0] ?? 0);
    const last7Days = Number(last7Res.results?.[0]?.[0] ?? 0);
    const last30Days = Number(last30Res.results?.[0]?.[0] ?? 0);
    const last24Hours = Number(last24Res.results?.[0]?.[0] ?? 0);
    const last48Hours = Number(last48Res.results?.[0]?.[0] ?? 0);

    const daily = (dailyRes.results ?? []).map(([date, count]) => ({
      date: String(date),
      count: Number(count),
    }));

    res
      .status(200)
      .json({
        allTime,
        last7Days,
        last30Days,
        last24Hours,
        last48Hours,
        daily,
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
