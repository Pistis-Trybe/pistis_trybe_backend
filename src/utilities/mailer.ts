import config from "../configurations";

export interface IMailPayload {
  to: string;
  toName?: string | undefined;
  subject: string;
  html: string;
  text?: string | undefined;
}

export const sendMail = async ({ to, toName, subject, html, text }: IMailPayload): Promise<void> => {
  const token = config.ZEPTOMAIL_TOKEN;
  const fromAddress = config.ZEPTOMAIL_FROM_ADDRESS;

  if (!token || !fromAddress) {
    if (config.stage === "production") {
      throw new Error("ZeptoMail is not configured (ZEPTOMAIL_TOKEN / ZEPTOMAIL_FROM_ADDRESS)");
    }
    console.log(
      `\n[mailer:dev] ZeptoMail not configured, printing email instead\n` +
        `  To:      ${to}\n  Subject: ${subject}\n  Body:    ${text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`,
    );
    return;
  }

  const response = await fetch(config.ZEPTOMAIL_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`,
    },
    body: JSON.stringify({
      from: { address: fromAddress, name: config.ZEPTOMAIL_FROM_NAME },
      to: [{ email_address: { address: to, name: toName || to } }],
      subject,
      htmlbody: html,
      ...(text && { textbody: text }),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`ZeptoMail request failed (${response.status}): ${detail}`);
  }
};
