const MONO_API_URL = "https://api.monobank.ua/api/merchant";
const MONO_TOKEN = process.env.MONOBANK_API_TOKEN;

async function requestMono(endpoint, body) {
  const response = await fetch(`${MONO_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "X-Token": MONO_TOKEN || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ MonoPay API error [${endpoint}]:`, data);
    throw new Error(
      data.errText || data.message || "Помилка звернення до API Monobank",
    );
  }

  return data;
}

export const monopayService = {
  /**
   * Створення інвойсу (холдування коштів на зміну)
   */
  async createInvoice({
    amount,
    shiftId,
    applicationId,
    redirectUrl,
    webhookUrl,
  }) {
    const hookUrl =
      webhookUrl ||
      `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/webhook`;
    console.log(`🔗 [MonoPay] Creating invoice with Webhook URL: ${hookUrl}`);

    const payload = {
      amount: Math.round(Number(amount) * 100), // копійки
      ccy: 980, // UAH
      merchantPaymInfo: {
        reference: `shift_${shiftId}_app_${applicationId}_${Date.now()}`,
        destination: `Холдування коштів на зміну #${shiftId}`,
        comment: `Бронювання кандидата на зміну #${shiftId}`,
      },
      redirectUrl:
        redirectUrl ||
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`,
      webHookUrl: hookUrl,
      validity: 3600,
      paymentType: "hold",
    };

    return await requestMono("/invoice/create", payload);
  },

  /**
   * Перевірка статусу інвойсу в Monobank напряму
   */
  async getInvoiceStatus(invoiceId) {
    const response = await fetch(
      `${MONO_API_URL}/invoice/status?invoiceId=${invoiceId}`,
      {
        method: "GET",
        headers: {
          "X-Token": MONO_TOKEN || "",
        },
      },
    );
    return await response.json();
  },

  /**
   * Фінальне списання заблокованих коштів (після завершення зміни)
   */
  async finalizeHold(invoiceId, amount) {
    const payload = {
      invoiceId,
      amount: Math.round(Number(amount) * 100),
    };

    return await requestMono("/invoice/finalize", payload);
  },

  /**
   * Скасування холда (повернення заблокованих коштів)
   */
  async cancelHold(invoiceId) {
    return await requestMono("/invoice/cancel", { invoiceId });
  },
};
