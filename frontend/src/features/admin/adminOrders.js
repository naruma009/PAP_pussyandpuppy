export function formatAdminOrderDate(value, language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatShippingAddress(customer = {}) {
  const locality = [customer.district, customer.province].filter(Boolean).join(", ");
  return [customer.address, locality, customer.postalCode].filter(Boolean).join(", ");
}
