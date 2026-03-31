type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: unknown;
  issues?: Array<{ path?: Array<string | number>; message?: string }>;
  errors?: unknown;
};

function formatUnknownDetails(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => formatUnknownDetails(item));
  }

  if (typeof value === 'object') {
    const pairs = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${String(v)}`);

    return pairs.length ? pairs : [JSON.stringify(value)];
  }

  return [String(value)];
}

async function readErrorPayload(res: Response): Promise<ApiErrorPayload | string | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as ApiErrorPayload;
  } catch {
    return text;
  }
}

export async function throwApiError(res: Response, fallbackMessage: string): Promise<never> {
  const payload = await readErrorPayload(res);
  const prefix = `Request failed (${res.status} ${res.statusText})`;

  let baseMessage = fallbackMessage;
  const detailLines: string[] = [];

  if (typeof payload === 'string') {
    baseMessage = payload || fallbackMessage;
  } else if (payload) {
    baseMessage = payload.message || payload.error || fallbackMessage;

    if (Array.isArray(payload.issues) && payload.issues.length > 0) {
      payload.issues.forEach((issue) => {
        const field = issue.path?.length ? issue.path.join('.') : 'field';
        if (issue.message) {
          detailLines.push(`${field}: ${issue.message}`);
        }
      });
    }

    detailLines.push(...formatUnknownDetails(payload.errors));
    detailLines.push(...formatUnknownDetails(payload.details));
  }

  const uniqueDetails = Array.from(new Set(detailLines.filter(Boolean)));
  const detailsBlock = uniqueDetails.length ? `\nDetails:\n- ${uniqueDetails.join('\n- ')}` : '';

  throw new Error(`${prefix}\n${baseMessage}${detailsBlock}`);
}

export function getErrorMessage(error: unknown, fallback = 'Unexpected error occurred'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
