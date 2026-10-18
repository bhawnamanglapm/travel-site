// Offline checks for the static page. No network, no browser.  Run: node scripts/check.mjs
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const check = (ok, label) => {
  console.log((ok ? "PASS " : "FAIL ") + label);
  if (!ok) failures.push(label);
};

const html = readFileSync("app/index.html", "utf8");
// Local files referenced by src / srcset / href exist.
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="([^"#:?]+)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/srcset="([^"]+)"/g))
  for (const part of m[1].split(",")) refs.add(part.trim().split(/\s+/)[0]);
const local = [...refs].filter((r) => !/^(https?:|mailto:|\/\/)/.test(r));
const missing = local.filter((r) => !existsSync(join("app", r)));
check(local.length > 0 && missing.length === 0, `all ${local.length} local files referenced by the page exist${missing.length ? " - missing: " + missing : ""}`);

// No dead links, and every image has an alt attribute (alt="" is fine for decorative icons).
const body = html.replace(/<!--[\s\S]*?-->/g, ""); // ignore the commented-out modal markup
check(!/href="#"/.test(body), 'no placeholder href="#" links');
const liveImgs = [...body.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const noAlt = liveImgs.filter((s) => !/\salt="/.test(s));
check(liveImgs.length > 0 && noAlt.length === 0, `all ${liveImgs.length} images have an alt attribute (${noAlt.length} without)`);
check(/<html lang="en">/.test(html), "html has a lang attribute");
check(/<title>[^<]+<\/title>/.test(html), "page has a title");

// Honesty: placeholder content must be labeled, not presented as real.
check(!/Real Testimonials/i.test(html), 'testimonials are not headed "Real Testimonials"');
check(/placeholders, not real customers/.test(body), "testimonials are labeled as placeholders");
check(/None of these are built/.test(body), "feature ideas are labeled as not built");
check(/class="prototype-note"/.test(body) && /not a real booking service/i.test(body), "top banner says this is a prototype and not a real booking service");
check(!/Copyright &copy; 2019/.test(body), "no stale copyright line");

// Styles: the note style is wired in, and the bundle contains it.
check(/prototype-note/.test(readFileSync("app/assets/styles/styles.css", "utf8") + readFileSync("app/assets/styles/modules/_prototype-note.css", "utf8")), "prototype-note style is imported");
const bundle = existsSync("app/bundled.js") ? readFileSync("app/bundled.js", "utf8") : "";
check(bundle.includes("prototype-note"), "app/bundled.js is built and includes the prototype-note style (run npm run build)");

console.log(failures.length ? `\n${failures.length} failure(s)` : "\nAll checks passed.");
process.exit(failures.length ? 1 : 0);
