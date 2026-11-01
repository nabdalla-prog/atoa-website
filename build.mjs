// Builds the site:
//   1. src/page.html + src/i18n/<lang>.json  ->  index.html, ar/index.html, sw/index.html, fr/index.html
//   2. src/input.css (Tailwind 4 + DaisyUI 5)  ->  assets/site.css
// Usage: node build.mjs   (add --watch to rebuild on save)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { watch } from "node:fs";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

// ===== Settings: replace these before launch =====
const SITE = "https://atoafulltaxservices.com/";
const PHONE = "3097218006"; // 10 digits, used for both the phone line and WhatsApp
const EMAIL = "hello@atoafulltaxservices.com";
const ADDRESS = { street: "823 20th St", city: "Rock Island", region: "IL", zip: "61201" };
const WHATSAPP = `https://wa.me/1${PHONE || "0000000000"}`;
const PHONE_SHOWN = PHONE ? `(${PHONE.slice(0, 3)}) ${PHONE.slice(3, 6)}‑${PHONE.slice(6)}` : "";

const LATIN_FONTS = "family=IBM+Plex+Mono:wght@400;500&family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700";
const ARABIC_FONTS = "family=Cairo:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600";
const LANGS = {
  en: { dir: "ltr", path: "",    label: "EN",   name: "English",   og: "en_US", locale: "en-US" },
  ar: { dir: "rtl", path: "ar/", label: "عربي", name: "العربية",   og: "ar_AR", locale: "ar-u-nu-latn" },
  sw: { dir: "ltr", path: "sw/", label: "SW",   name: "Kiswahili", og: "sw_KE", locale: "sw" },
  fr: { dir: "ltr", path: "fr/", label: "FR",   name: "Français",  og: "fr_FR", locale: "fr" },
};
// Every page loads the Arabic fonts too, because the language greetings appear on all of them
const FONTS = `https://fonts.googleapis.com/css2?${LATIN_FONTS}&${ARABIC_FONTS}&display=swap`;

// AtoA mark, redrawn from the logo sign: rising bars, orange ribbon, script "A" (body follows the text color)
const logoMark = '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><g class="logo-bars"><rect x="11" y="27" width="8" height="24" rx="1"/><rect x="21" y="16" width="8" height="26" rx="1"/><rect x="31" y="5" width="8" height="28" rx="1"/></g><path fill="#F7931E" d="M3 58C13 47 30 34 40 18 44 11 45 6 44 1 49 6 49 15 45 23 37 39 20 51 9 60Z"/><path fill="currentColor" fill-rule="evenodd" d="M9 60C20 51 37 39 45 23 47 19 48 15 48 11L50.4 39.5 58 37.5 51 44.5 51.5 51C52 56 54 59 58 62H43C45 59 45.5 56 45 52L44.6 47.5H32.5C28.5 50 26.5 54 26.5 58 22 61 15 61.5 9 60ZM34.5 43.5H44.3L43 26C40.5 32.5 38 38.5 34.5 43.5Z"/></svg>';
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const check = '<svg viewBox="0 0 24 24" class="size-4 mt-0.5 shrink-0 text-success" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
const cross = '<svg viewBox="0 0 24 24" class="size-4 mt-0.5 shrink-0 text-error" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

function langSwitch(cur, root, cls) {
  return Object.entries(LANGS).map(([code, l]) => {
    const on = code === cur;
    return `<a href="${root}${l.path}index.html" hreflang="${code}" lang="${code}" title="${l.name}"${on ? ' aria-current="page"' : ""} class="${cls}${on ? " is-on" : ""}${code === "ar" ? " font-arabic" : ""}">${l.label}</a>`;
  }).join("");
}

async function buildPages() {
  const tpl = await readFile("src/page.html", "utf8");
  for (const [code, l] of Object.entries(LANGS)) {
    const t = JSON.parse(await readFile(`src/i18n/${code}.json`, "utf8"));
    const root = l.path ? "../" : "";
    const fmt = new Intl.DateTimeFormat(l.locale, { month: "short", day: "numeric", timeZone: "UTC" });
    const vars = {
      ...t,
      lang: code, dir: l.dir, root, fonts: FONTS, og_locale: l.og,
      canonical: SITE + l.path, og_image: SITE + "og.jpg?v=2", // bump v when og.jpg changes, so WhatsApp/Facebook refresh their cached preview
      alternates: [...Object.entries(LANGS).map(([c, x]) => `<link rel="alternate" hreflang="${c}" href="${SITE + x.path}">`),
        `<link rel="alternate" hreflang="x-default" href="${SITE}">`].join("\n"),
      jsonld: JSON.stringify({
        "@context": "https://schema.org", "@type": "AccountingService", name: "AtoA", url: SITE + l.path,
        description: t.meta_description, knowsLanguage: ["en", "ar", "sw", "fr"],
        ...(PHONE && { telephone: "+1" + PHONE }), email: EMAIL,
        address: { "@type": "PostalAddress", streetAddress: ADDRESS.street, addressLocality: ADDRESS.city, addressRegion: ADDRESS.region, postalCode: ADDRESS.zip, addressCountry: "US" },
        areaServed: { "@type": "Country", name: "United States" },
      }),
      logo_mark: logoMark,
      lang_switch: langSwitch(code, root, "lang-link"),
      whatsapp: `${WHATSAPP}?text=${encodeURIComponent(t.wa_text)}`,
      whatsapp_base: WHATSAPP,
      phone: PHONE, email: EMAIL,
      contact_line: [PHONE && `<a href="tel:+1${PHONE}" class="link-quiet">${PHONE_SHOWN}</a>`, `<a href="mailto:${EMAIL}" class="link-quiet">${EMAIL}</a>`].filter(Boolean).join(" · "),
      address: `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.zip}`,
      map_url: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.zip}`),
      chk_en: "", chk_ar: "", chk_sw: "", chk_fr: "", [`chk_${code}`]: "checked",
      js: JSON.stringify(t.js),
      ...Object.fromEntries(["b1_items", "b2_items", "b3_items", "b4_items"].map(k => [k,
        t[k].map(i => `<li><label class="bring-item"><input type="checkbox" class="checkbox checkbox-primary checkbox-sm"><span>${i}</span></label></li>`).join("")])),
      t_promises: t.t_promises.map(i => `<li class="flex gap-3">${check}<span>${i}</span></li>`).join(""),
      t_warnings: t.t_warnings.map(i => `<li class="flex gap-3">${cross}<span>${i}</span></li>`).join(""),
      faq_items: t.faq_items.map(([q, a], i) => `<details class="collapse collapse-plus rounded-none border-b border-base-300" name="faq"${i ? "" : " open"}>
        <summary class="collapse-title text-lg font-medium px-0">${q}</summary>
        <div class="collapse-content px-0 text-base-content/70 leading-relaxed"><p>${a}</p></div></details>`).join("\n      "),
    };
    // Plain-text values used inside attributes get escaped; values with markup are inserted as written
    for (const k of ["meta_title", "meta_description"]) vars[k] = esc(vars[k]);
    const html = tpl
      .replace(/<!-- Template:.*?-->\n/, "<!-- Built from src/page.html by build.mjs: edit the template, not this file. -->\n")
      .replace(/\{\{date:(\d{4}-\d\d-\d\d)\}\}/g, (_, d) => fmt.format(new Date(d + "T00:00:00Z")))
      .replace(/\{\{(\w+)\}\}/g, (_, k) => {
        if (!(k in vars)) throw new Error(`${code}.json is missing "${k}"`);
        return vars[k];
      });
    await mkdir(l.path || ".", { recursive: true });
    await writeFile(`${l.path}index.html`, html);
  }
  console.log(`built ${Object.keys(LANGS).length} pages`);
}

async function buildCss() {
  const from = "src/input.css", to = "assets/site.css";
  const out = await postcss([tailwind({ optimize: { minify: true } })]).process(await readFile(from, "utf8"), { from, to });
  await writeFile(to, out.css);
  console.log(`built ${to} (${(out.css.length / 1024).toFixed(1)} KB)`);
}

// GitHub Pages extras: custom domain, robots.txt and a sitemap that lists every language version
async function buildHostingFiles() {
  await writeFile("CNAME", new URL(SITE).hostname + "\n");
  await writeFile("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
  const alts = Object.entries(LANGS).map(([c, x]) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${SITE + x.path}"/>`).join("\n");
  const urls = Object.values(LANGS).map(l => `  <url>\n    <loc>${SITE + l.path}</loc>\n${alts}\n  </url>`).join("\n");
  await writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
}

const build = async () => { await buildPages(); await buildCss(); await buildHostingFiles(); };
await build();
if (process.argv.includes("--watch")) {
  let t;
  watch("src", { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => build().catch(console.error), 120); });
  console.log("watching src/ …");
}
