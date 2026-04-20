import { getSettings } from "@/lib/settings";

export type PayPassRequestStatus =
  | "new"
  | "in_progress"
  | "pending"
  | "completed"
  | "cancelled"
  | "stuck";

export type LocalPaymentStatus = "unpaid" | "pending" | "paid" | "failed";

type PayPassRequestBody = {
  public_id?: string;
  client_request_id?: string | null;
  status?: PayPassRequestStatus | string;
  amount?: number;
  real_amount?: number | null;
  created_at?: string;
  updated_at?: string;
};

type PayPassCreateResponse = {
  success?: boolean;
  request?: PayPassRequestBody;
  telegram?: {
    link?: string;
    public_id?: string;
    bot_username?: string;
  };
  error?: string;
};

type PayPassGetResponse = {
  success?: boolean;
  request?: PayPassRequestBody;
  error?: string;
};

export type CreatePayPassRequestInput = {
  amountRub: number;
  clientRequestId: string;
  comment?: string;
  clientFio?: string;
  clientPhone?: string;
};

export type CreatePayPassRequestResult = {
  publicId: string;
  clientRequestId: string | null;
  status: string;
  telegramLink: string;
  createdAtRaw: string | null;
};

export type PayPassRequestLookup =
  | { publicId: string; clientRequestId?: never }
  | { publicId?: never; clientRequestId: string };

export type PayPassRequestResult = {
  publicId: string | null;
  clientRequestId: string | null;
  status: string;
  realAmountRub: number | null;
  createdAtRaw: string | null;
  updatedAtRaw: string | null;
  telegramLink: string | null;
};

function cleanBaseUrl(url: string) {
  return (url || "").trim().replace(/\/+$/, "");
}

function getBearerHeaderValue(rawKey: string) {
  const key = rawKey.trim();
  if (!key) return "";
  return key.toLowerCase().startsWith("bearer ") ? key : `Bearer ${key}`;
}

function normalizeStatus(status: string | undefined): PayPassRequestStatus | null {
  if (!status) return null;
  if (
    status === "new" ||
    status === "in_progress" ||
    status === "pending" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "stuck"
  ) {
    return status;
  }
  return null;
}

export function mapPayPassStatusToLocal(status: string | undefined): LocalPaymentStatus {
  const normalized = normalizeStatus(status);
  if (!normalized) return "pending";
  if (normalized === "completed") return "paid";
  if (normalized === "cancelled" || normalized === "stuck") return "failed";
  return "pending";
}

async function fetchPayPass<T>(
  pathCandidates: string[],
  init: RequestInit,
): Promise<T> {
  const settings = await getSettings();
  const baseUrl = cleanBaseUrl(settings.paypass_api_base_url);
  const bearer = getBearerHeaderValue(settings.paypass_api_key);

  if (!baseUrl) {
    throw new Error("PayPass base URL is not configured");
  }
  if (!bearer) {
    throw new Error("PayPass API key is not configured");
  }

  let lastError: string | null = null;
  for (const path of pathCandidates) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (res.status === 404) {
      lastError = `Path not found: ${url}`;
      continue;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || `PayPass request failed with status ${res.status}`);
    }

    return data as T;
  }

  throw new Error(lastError || "PayPass endpoint not found");
}

export async function createPayPassRequest(
  input: CreatePayPassRequestInput,
): Promise<CreatePayPassRequestResult> {
  const data = await fetchPayPass<PayPassCreateResponse>(
    ["/api_add_request.php", "/merch/api_add_request.php"],
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountRub,
        currency_code: "RUB",
        comment: input.comment || undefined,
        client_fio: input.clientFio || undefined,
        client_phone: input.clientPhone || undefined,
        client_request_id: input.clientRequestId,
      }),
    },
  );

  if (!data.success || !data.request) {
    throw new Error(data.error || "PayPass returned invalid create response");
  }

  const publicId = String(data.request.public_id ?? data.telegram?.public_id ?? "").trim();
  const telegramLink = String(data.telegram?.link ?? "").trim();
  if (!publicId || !telegramLink) {
    throw new Error("PayPass create response missing public_id or telegram link");
  }

  return {
    publicId,
    clientRequestId: data.request.client_request_id ?? null,
    status: String(data.request.status ?? "new"),
    telegramLink,
    createdAtRaw: data.request.created_at ?? null,
  };
}

export async function getPayPassRequest(
  lookup: PayPassRequestLookup,
): Promise<PayPassRequestResult> {
  const query =
    "publicId" in lookup
      ? `?public_id=${encodeURIComponent(lookup.publicId)}`
      : `?client_request_id=${encodeURIComponent(lookup.clientRequestId)}`;

  const data = await fetchPayPass<PayPassGetResponse>(
    [`/api_get_request.php${query}`, `/merch/api_get_request.php${query}`],
    { method: "GET" },
  );

  if (!data.success || !data.request) {
    throw new Error(data.error || "PayPass returned invalid request info");
  }

  const req = data.request;
  return {
    publicId: req.public_id ? String(req.public_id) : null,
    clientRequestId: req.client_request_id ? String(req.client_request_id) : null,
    status: String(req.status ?? "new"),
    realAmountRub: typeof req.real_amount === "number" ? req.real_amount : null,
    createdAtRaw: req.created_at ?? null,
    updatedAtRaw: req.updated_at ?? null,
    telegramLink: null,
  };
}
