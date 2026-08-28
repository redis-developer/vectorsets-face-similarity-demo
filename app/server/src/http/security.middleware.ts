import type { Express, RequestHandler } from 'express';
import type { CorsOptions } from 'cors';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import {
  DEFAULT_BODY_LIMIT,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from '../utils/constants.js';

type SecurityConfig = {
  corsOrigins: string[];
  frameAncestors: string[];
};

// CSP is disabled because this single service also serves its own Vite SPA from the
// same origin; helmet's default CSP would block the app's inline module bootstrap.
// Every other helmet protection (HSTS, no-sniff, x-powered-by removal, etc.) stays on;
// frameguard/CORP are relaxed only when an iframe allowlist is configured (see
// buildHelmetOptions).
// Empty allowlist -> `origin: false`: CORS is NOT enabled, so no
// Access-Control-Allow-Origin is sent and the browser blocks cross-origin calls.
// Same-origin requests (the single-service deploy that serves this SPA) never need
// CORS, so they keep working. A non-empty allowlist opts specific cross-origin callers
// in (e.g. a separately-hosted Vite dev origin).
const buildCorsOptions = (allowedOrigins: string[]): CorsOptions =>
  allowedOrigins.length > 0
    ? { origin: allowedOrigins, credentials: true }
    : { origin: false };

// Embedding: helmet's defaults send `X-Frame-Options: SAMEORIGIN` plus
// `Cross-Origin-Resource-Policy: same-origin`, which together stop the Redis Sandbox
// (redis.io/try/sandbox/demo-view) from framing this demo. With a non-empty allowlist we
// swap the blanket X-Frame-Options for a CSP `frame-ancestors` allowlist - the modern,
// per-origin equivalent - and relax CORP so the document may load as a nested browsing
// context. Empty allowlist -> helmet's defaults stand and embedding stays blocked.
const buildHelmetOptions = (
  frameAncestors: string[],
): Parameters<typeof helmet>[0] => {
  const isEmbeddable = frameAncestors.length > 0;
  return {
    contentSecurityPolicy: false,
    ...(isEmbeddable
      ? {
          frameguard: false,
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
      : {}),
  };
};

// Only the frame-ancestors directive is emitted, never a full CSP: helmet's default policy
// is off on purpose (it would block the SPA's inline module bootstrap), and frame-ancestors
// constrains who may embed us without touching script/style loading.
const applyEmbedPolicy = (app: Express, frameAncestors: string[]): void => {
  if (frameAncestors.length === 0) {
    return;
  }
  const policy = `frame-ancestors 'self' ${frameAncestors.join(' ')}`;
  app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy', policy);
    next();
  });
};

// helmet + cors + compression + JSON/urlencoded body parsing (with size limits).
const applyBaseSecurity = (app: Express, config: SecurityConfig): void => {
  app.use(helmet(buildHelmetOptions(config.frameAncestors)));
  applyEmbedPolicy(app, config.frameAncestors);
  app.use(cors(buildCorsOptions(config.corsOrigins)));
  app.use(compression());
  app.use(express.json({ limit: DEFAULT_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT }));
};

// Rate limiter for /api: newElementSearch calls Gemini, so we throttle per IP.
const createApiRateLimiter = (): RequestHandler =>
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });

export { applyBaseSecurity, createApiRateLimiter };
