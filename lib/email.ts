import "server-only";

const RESEND_API = "https://api.resend.com/emails";

export function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_TO);
}

type SendOpts = {
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendOwnerEmail(opts: SendOpts): Promise<void> {
  if (!hasResendConfig()) {
    console.warn("[email] Resend not configured; skipping notification");
    return;
  }
  const from = process.env.NOTIFY_FROM ?? "Majorille Garden <noreply@majorillegarden.nl>";
  const to = process.env.NOTIFY_TO!;
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error", res.status, body);
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

export function contactNotificationHtml(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2A1810">
      <h2 style="font-family:Georgia,serif;color:#2A1810;margin:0 0 16px">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6B5A4B;width:120px">Name</td><td>${escape(input.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B5A4B">Email</td><td><a href="mailto:${escape(input.email)}">${escape(input.email)}</a></td></tr>
        ${input.phone ? `<tr><td style="padding:6px 0;color:#6B5A4B">Phone</td><td>${escape(input.phone)}</td></tr>` : ""}
      </table>
      <hr style="border:none;border-top:1px solid #E0D3B8;margin:20px 0"/>
      <p style="white-space:pre-wrap;line-height:1.6">${escape(input.message)}</p>
    </div>
  `;
}
