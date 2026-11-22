export interface R2ObjectBodyLike {
  body: ReadableStream | null;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  size: number;
  etag?: string;
}

export interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array | string | ReadableStream,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
}

export interface S3StorageConfig {
  mediaBucket?: R2BucketLike;
  s3Endpoint?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Region?: string;
  s3PublicUrl?: string;
}

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '169.254.169.254' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export function validateS3EndpointUrl(raw?: string): URL | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'https:') return null;
    if (isPrivateOrBlockedHost(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sanitizeObjectKey(rawKey: string): string | null {
  const cleaned = rawKey.replace(/^\/+/, '').trim();
  if (!cleaned || cleaned.length > 180) return null;
  if (cleaned.includes('..') || cleaned.includes('\\') || /[\0\r\n]/.test(cleaned)) {
    return null;
  }
  if (!/^[A-Za-z0-9/_.-]+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return toHex(digest);
}

async function hmacSha256(key: ArrayBuffer | Uint8Array | string, data: string): Promise<ArrayBuffer> {
  const rawKey = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

function encodeRfc3986Path(pathStr: string): string {
  return pathStr
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

async function signS3Request(params: {
  method: 'PUT' | 'GET';
  endpoint: URL;
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  payload: Uint8Array | string;
  contentType?: string;
}): Promise<{ url: string; headers: Record<string, string> }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';

  const basePath = params.endpoint.pathname.replace(/\/+$/, '');
  const fullPath = `${basePath}/${encodeRfc3986Path(params.bucket)}/${encodeRfc3986Path(params.key)}`;
  const targetUrl = `${params.endpoint.origin}${fullPath}`;

  const payloadHash = await sha256Hex(params.payload);
  const headerEntries: Record<string, string> = {
    host: params.endpoint.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (params.contentType) {
    headerEntries['content-type'] = params.contentType;
  }

  const sortedHeaderKeys = Object.keys(headerEntries).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headerEntries[k]}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    params.method,
    fullPath,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${params.region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = await hmacSha256(`AWS4${params.secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, params.region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: targetUrl,
    headers: {
      ...headerEntries,
      Authorization: authorization,
    },
  };
}

export function decodeBase64DataUrl(dataUrl: string): {
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
  ext: string;
} {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('Only PNG, JPEG, WEBP, and GIF image uploads are supported.');
  }
  const contentType = match[1];
  const ext = ALLOWED_IMAGE_MIME[contentType];
  const base64 = match[2];

  const estimatedBytes = Math.floor((base64.length * 3) / 4);
  if (estimatedBytes > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds the 4 MB upload limit.');
  }

  const binary = atob(base64);
  if (binary.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds the 4 MB upload limit.');
  }
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, contentType, ext };
}

export async function uploadMediaObject(
  config: S3StorageConfig,
  params: {
    bytes: Uint8Array<ArrayBuffer>;
    contentType: string;
    ext: string;
    folder?: string;
  }
): Promise<{ key: string; url: string; storage: 'cloudflare-r2' | 's3-endpoint'; sha256: string }> {
  if (params.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('Image exceeds the 4 MB upload limit.');
  }
  const safeFolder = (params.folder || 'uploads').replace(/[^A-Za-z0-9_-]/g, '') || 'uploads';
  const month = new Date().toISOString().slice(0, 7);
  const randBytes = new Uint8Array(8);
  crypto.getRandomValues(randBytes);
  const randHex = toHex(randBytes.buffer);
  const key = `${safeFolder}/${month}/${randHex}.${params.ext}`;
  const sha256 = (await sha256Hex(params.bytes)).slice(0, 24);

  // 1. Prefer Cloudflare Worker native R2 bucket binding (zero egress & zero API key overhead)
  if (config.mediaBucket) {
    await config.mediaBucket.put(key, params.bytes, {
      httpMetadata: {
        contentType: params.contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        sha256,
      },
    });
    const publicBase = config.s3PublicUrl?.trim().replace(/\/+$/, '');
    return {
      key,
      url: publicBase ? `${publicBase}/${key}` : `/api/media/${key}`,
      storage: 'cloudflare-r2',
      sha256,
    };
  }

  // 2. Fallback to S3-Compatible API Endpoint (Cloudflare R2 S3 API, AWS S3, Backblaze B2, MinIO)
  const endpoint = validateS3EndpointUrl(config.s3Endpoint);
  if (!endpoint || !config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
    throw new Error(
      'Object storage is not configured. Bind MEDIA_BUCKET (Cloudflare R2) or set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.'
    );
  }

  const region = (config.s3Region || 'auto').trim();
  const signed = await signS3Request({
    method: 'PUT',
    endpoint,
    bucket: config.s3Bucket.trim(),
    key,
    region,
    accessKeyId: config.s3AccessKeyId.trim(),
    secretAccessKey: config.s3SecretAccessKey.trim(),
    payload: params.bytes,
    contentType: params.contentType,
  });

  const putRes = await fetch(signed.url, {
    method: 'PUT',
    headers: signed.headers,
    body: params.bytes,
  });

  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => '');
    throw new Error(`S3 upload failed (${putRes.status}): ${errText.slice(0, 200)}`);
  }

  const publicBase = config.s3PublicUrl?.trim().replace(/\/+$/, '');
  return {
    key,
    url: publicBase ? `${publicBase}/${key}` : `/api/media/${key}`,
    storage: 's3-endpoint',
    sha256,
  };
}

export async function getMediaObjectResponse(
  config: S3StorageConfig,
  rawKey: string
): Promise<Response> {
  const key = sanitizeObjectKey(rawKey);
  if (!key) {
    return new Response(JSON.stringify({ error: 'Invalid media key.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  if (config.mediaBucket) {
    const obj = await config.mediaBucket.get(key);
    if (!obj || !obj.body) {
      return new Response(JSON.stringify({ error: 'Media object not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    return new Response(obj.body, {
      status: 200,
      headers: {
        'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': obj.httpMetadata?.cacheControl || 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const endpoint = validateS3EndpointUrl(config.s3Endpoint);
  if (!endpoint || !config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
    return new Response(JSON.stringify({ error: 'Object storage not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const signed = await signS3Request({
    method: 'GET',
    endpoint,
    bucket: config.s3Bucket.trim(),
    key,
    region: (config.s3Region || 'auto').trim(),
    accessKeyId: config.s3AccessKeyId.trim(),
    secretAccessKey: config.s3SecretAccessKey.trim(),
    payload: '',
  });

  const s3Res = await fetch(signed.url, {
    method: 'GET',
    headers: signed.headers,
  });

  if (!s3Res.ok) {
    return new Response(JSON.stringify({ error: 'Media object not found.' }), {
      status: s3Res.status === 404 ? 404 : 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(s3Res.body, {
    status: 200,
    headers: {
      'Content-Type': s3Res.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
