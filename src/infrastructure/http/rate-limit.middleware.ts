import { TooManyRequestsError } from "@shared/errors";
import type { Context, Next } from "hono";
import { getConnInfo } from "hono/bun";

/**
 * Configuração de uma janela de rate limiting (fixed-window).
 */
export interface RateLimitOptions {
  /** Número máximo de requisições permitidas dentro da janela. */
  max: number;
  /** Duração da janela em milissegundos. */
  windowMs: number;
}

interface Bucket {
  count: number;
  /** Epoch (ms) em que a janela atual expira e o contador zera. */
  resetAt: number;
}

/**
 * Cria um middleware de rate limiting in-memory por IP (fixed-window).
 *
 * Cada instância mantém seu próprio store, isolando o limite por rota — duas
 * chamadas a este factory geram contadores independentes. Voltado às rotas
 * públicas de autenticação para mitigar brute-force (OWASP A05).
 *
 * @remarks O store é in-memory: reseta a cada restart e não escala
 * horizontalmente. Aceitável enquanto a persistência também é in-memory;
 * migrar para store compartilhado (ex.: Redis) junto com o banco.
 */
export function createRateLimit({ max, windowMs }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  let lastSweep = Date.now();

  return async (c: Context, next: Next) => {
    const now = Date.now();
    sweepExpired(buckets, now, windowMs, lastSweep, (t) => {
      lastSweep = t;
    });

    const key = clientIp(c);
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      const error = new TooManyRequestsError();
      c.header("Retry-After", String(retryAfter));
      return c.json(error.toJSON(), error.statusCode);
    }

    await next();
  };
}

/**
 * Remove buckets expirados no máximo uma vez por janela, evitando crescimento
 * ilimitado do Map por IPs que não retornam.
 */
function sweepExpired(
  buckets: Map<string, Bucket>,
  now: number,
  windowMs: number,
  lastSweep: number,
  setLastSweep: (t: number) => void
) {
  if (now - lastSweep < windowMs) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  setLastSweep(now);
}

/**
 * Resolve o IP do cliente. Prioriza `X-Forwarded-For` (atrás de proxy) e cai
 * para o endereço da conexão; "unknown" quando indisponível (ex.: testes).
 */
function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}
