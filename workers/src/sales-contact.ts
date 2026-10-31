export const SALES_CONTACT = {
  whatsapp: "6282321122968",
  email: "vfvincentwong@gmail.com",
} as const;

const idNumber = new Intl.NumberFormat("id-ID");

export function formatIdrId(value: number): string {
  return `Rp${idNumber.format(value)}`;
}

export function activationMessage(planName: string, priceIdr: number): string {
  return `Halo, saya ingin aktivasi paket ${planName} (${formatIdrId(priceIdr)} / 30 hari) GrokBotHub`;
}

export function whatsappHref(planName: string, priceIdr: number): string {
  return `https://wa.me/${SALES_CONTACT.whatsapp}?text=${encodeURIComponent(activationMessage(planName, priceIdr))}`;
}

export function mailtoHref(planName: string, priceIdr: number): string {
  const subject = `Aktivasi paket ${planName} GrokBotHub`;
  return `mailto:${SALES_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(activationMessage(planName, priceIdr))}`;
}
