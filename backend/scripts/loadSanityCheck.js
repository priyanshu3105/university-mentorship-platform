/*
  Lightweight load sanity script.
  Usage:
    node scripts/loadSanityCheck.js

  Optional env:
    BASE_URL=http://localhost:4000
    CONCURRENCY=20
    ITERATIONS=100
*/

const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
const concurrency = Number.parseInt(process.env.CONCURRENCY || '20', 10);
const iterations = Number.parseInt(process.env.ITERATIONS || '100', 10);

function nowMs() {
  return Date.now();
}

async function runSingle() {
  const start = nowMs();
  const res = await fetch(`${baseUrl}/health`);
  const durationMs = nowMs() - start;
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return durationMs;
}

async function run() {
  const samples = [];
  for (let i = 0; i < iterations; i += concurrency) {
    const batchSize = Math.min(concurrency, iterations - i);
    const batch = Array.from({ length: batchSize }, () => runSingle());
    const batchResults = await Promise.all(batch);
    samples.push(...batchResults);
  }

  samples.sort((a, b) => a - b);
  const p50 = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const max = samples[samples.length - 1];
  const avg = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        baseUrl,
        iterations,
        concurrency,
        avg_ms: avg,
        p50_ms: p50,
        p95_ms: p95,
        max_ms: max,
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

