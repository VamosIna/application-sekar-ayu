// Spasi HARUS jadi %20, bukan "+" — app Gmail iOS tidak mengartikan "+" sebagai spasi
// (itu penyebab draft muncul "Kepada+Tim+..."). URLSearchParams default memakai "+",
// jadi kita ganti ke %20.
function toQuery(params: Record<string, string>): string {
  return new URLSearchParams(params).toString().replace(/\+/g, "%20");
}

export function buildGmailWebUrl(to: string, subject: string, body: string): string {
  const q = toQuery({
    view: "cm",
    fs: "1",
    tf: "1",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${q}`;
}

export function buildGmailAppUrl(to: string, subject: string, body: string): string {
  const q = toQuery({ to, subject, body });
  return `googlegmail:///co?${q}`;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPhoneLike = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return iPhoneLike || iPadOS;
}

/**
 * Buka Gmail dengan draft siap kirim.
 * - iOS: coba app Gmail (googlegmail://); kalau app tidak terpasang, otomatis
 *   fallback ke compose web Gmail.
 * - Non-iOS (Android/desktop): langsung buka compose web Gmail di tab baru.
 */
export function openGmail(to: string, subject: string, body: string): void {
  if (typeof window === "undefined") return;
  const web = buildGmailWebUrl(to, subject, body);

  if (isIOS()) {
    let leftPage = false;
    const markLeft = () => {
      leftPage = true;
    };
    document.addEventListener("visibilitychange", markLeft, { once: true });
    window.addEventListener("pagehide", markLeft, { once: true });

    window.setTimeout(() => {
      if (!leftPage) window.location.href = web;
    }, 1400);

    window.location.href = buildGmailAppUrl(to, subject, body);
    return;
  }

  window.open(web, "_blank", "noopener,noreferrer");
}

export function openExternal(url: string): void {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
