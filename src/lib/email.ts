import nodemailer from "nodemailer";
import { getSettings } from "@/lib/settings";
import { getStatusMeta } from "@/lib/order-statuses";

async function getTransporter() {
  const s = await getSettings();
  if (!s.smtp_user || !s.smtp_pass) return null;
  return nodemailer.createTransport({
    host: s.smtp_host || "smtp.gmail.com",
    port: Number(s.smtp_port) || 587,
    secure: s.smtp_secure === "true",
    auth: { user: s.smtp_user, pass: s.smtp_pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
}

async function getSiteUrl() {
  const s = await getSettings();
  return (s.site_url || "http://localhost:3000").replace(/\/$/, "");
}

async function getFrom() {
  const s = await getSettings();
  const smtpFrom = s.smtp_from.trim();
  const smtpUser = s.smtp_user.trim();

  // smtp_from may be a full mailbox string: "Shop" <info@example.com>
  if (smtpFrom.includes("<") && smtpFrom.includes(">")) return smtpFrom;
  if (smtpFrom) return `"SportNutrition" <${smtpFrom}>`;
  if (smtpUser) return `"SportNutrition" <${smtpUser}>`;
  return `"SportNutrition" <noreply@example.com>`;
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderId,
  chatToken,
}: {
  to: string;
  customerName: string;
  orderId: number;
  chatToken: string;
}) {
  const transporter = await getTransporter();
  if (!transporter) return;

  const siteUrl = await getSiteUrl();
  const from = await getFrom();
  const chatUrl = `${siteUrl}/chat/${orderId}?token=${chatToken}`;

  await transporter.sendMail({
    from,
    to,
    subject: `Заказ #${orderId} оформлен — SportNutrition`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Спасибо за заказ, ${customerName}!</h2>
        <p>Ваш заказ <strong>#${orderId}</strong> успешно принят. Мы свяжемся с вами в ближайшее время.</p>
        <p>Если у вас есть вопросы — напишите нам в чат прямо сейчас:</p>
        <a href="${chatUrl}"
           style="display:inline-block;margin-top:12px;padding:12px 24px;background:#e02c5c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Открыть чат с магазином
        </a>
        <p style="margin-top:24px;font-size:13px;color:#7d879c">
          Ссылка на чат привязана к вашему заказу и действует постоянно.
        </p>
      </div>
    `,
  });
}

export async function verifyEmailTransport(): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSettings();
  const transporter = await getTransporter();
  if (!transporter) {
    return { ok: false, error: "Не заполнены SMTP логин и пароль" };
  }

  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка SMTP";
    const host = s.smtp_host || "smtp.gmail.com";
    const port = Number(s.smtp_port) || 587;
    const secure = s.smtp_secure === "true";

    if (message.includes("Greeting never received")) {
      return {
        ok: false,
        error:
          `SMTP не ответил на приветствие (host=${host}, port=${port}, secure=${secure}). ` +
          "Обычно причина в неверной паре порт/SSL: для 465 нужен secure=true, для 587 — secure=false.",
      };
    }

    return { ok: false, error: message };
  }
}

export async function sendOrderStatusEmail({
  to,
  customerName,
  orderId,
  chatToken,
  status,
  message,
}: {
  to: string;
  customerName: string;
  orderId: number;
  chatToken: string;
  status: string;
  message?: string;
}) {
  const transporter = await getTransporter();
  if (!transporter) return;

  const siteUrl = await getSiteUrl();
  const from = await getFrom();
  const chatUrl = `${siteUrl}/chat/${orderId}?token=${chatToken}`;
  const statusMeta = getStatusMeta(status);

  const statusColors: Record<string, string> = {
    new:        "#3b82f6",
    processing: "#f59e0b",
    assembled:  "#8b5cf6",
    shipped:    "#f97316",
    delivered:  "#22c55e",
    cancelled:  "#ef4444",
  };
  const color = statusColors[status] ?? "#e02c5c";

  await transporter.sendMail({
    from,
    to,
    subject: `Заказ #${orderId} — статус изменён на «${statusMeta.label}»`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Обновление по заказу #${orderId}</h2>
        <p>Здравствуйте, <strong>${customerName}</strong>!</p>
        <p>Статус вашего заказа изменился:</p>
        <div style="display:inline-block;margin:16px 0;padding:10px 22px;background:${color}1a;border:1px solid ${color}4d;border-radius:999px;font-size:15px;font-weight:600;color:${color}">
          ${statusMeta.label}
        </div>
        ${message ? `
        <div style="margin:20px 0;padding:14px 18px;background:#f8f9fc;border-left:4px solid ${color};border-radius:4px;font-size:14px;color:#1d2a38;white-space:pre-wrap">${message}</div>
        ` : ""}
        <p style="margin-top:8px">Если у вас есть вопросы — вы можете написать нам прямо сейчас:</p>
        <a href="${chatUrl}"
           style="display:inline-block;margin-top:12px;padding:12px 24px;background:#e02c5c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Открыть чат с магазином
        </a>
        <p style="margin-top:24px;font-size:13px;color:#7d879c">
          Ссылка на чат привязана к вашему заказу и действует постоянно.
        </p>
      </div>
    `,
  });
}

export async function sendNewMessageEmail({
  to,
  customerName,
  orderId,
  chatToken,
  messageText,
}: {
  to: string;
  customerName: string;
  orderId: number;
  chatToken: string;
  messageText: string;
}) {
  const transporter = await getTransporter();
  if (!transporter) return;

  const siteUrl = await getSiteUrl();
  const from = await getFrom();
  const chatUrl = `${siteUrl}/chat/${orderId}?token=${chatToken}`;

  await transporter.sendMail({
    from,
    to,
    subject: `Новое сообщение по заказу #${orderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Новое сообщение от продавца</h2>
        <p>Здравствуйте, ${customerName}!</p>
        <p>По вашему заказу <strong>#${orderId}</strong> пришёл ответ:</p>
        <blockquote style="border-left:4px solid #e02c5c;margin:16px 0;padding:12px 16px;background:#fdf2f5;border-radius:4px;font-style:italic">
          ${messageText}
        </blockquote>
        <a href="${chatUrl}"
           style="display:inline-block;margin-top:12px;padding:12px 24px;background:#e02c5c;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Открыть чат
        </a>
      </div>
    `,
  });
}

export async function sendPromoCodeAnnouncementEmail({
  to,
  customerName,
  code,
  discountPercent,
  startsAt,
  endsAt,
  productNames,
  appliesToAll,
}: {
  to: string;
  customerName: string;
  code: string;
  discountPercent: number;
  startsAt: Date;
  endsAt: Date;
  productNames: string[];
  appliesToAll: boolean;
}) {
  const transporter = await getTransporter();
  if (!transporter) return;

  const from = await getFrom();
  const productsText = appliesToAll
    ? "Промокод действует на все товары магазина."
    : `Промокод действует на товары: ${productNames.join(", ")}.`;

  await transporter.sendMail({
    from,
    to,
    subject: `Промокод ${code} — скидка ${discountPercent}%`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1d2a38">
        <h2 style="color:#e02c5c">Для вас действует новый промокод</h2>
        <p>Здравствуйте, <strong>${customerName}</strong>!</p>
        <p>
          Для вас доступен промокод <strong>${code}</strong> со скидкой
          <strong> ${discountPercent}%</strong>.
        </p>
        <p>${productsText}</p>
        <p>
          Срок действия: с <strong>${startsAt.toLocaleString("ru-RU")}</strong>
          до <strong>${endsAt.toLocaleString("ru-RU")}</strong>.
        </p>
        <p style="margin-top:24px;font-size:13px;color:#7d879c">
          Промокод можно использовать один раз на один email.
        </p>
      </div>
    `,
  });
}
