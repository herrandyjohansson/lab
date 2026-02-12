# Alternative Solutions for Ticket Status Detection

Efficient ways to detect when Project Hail Mary changes from "INVÄNTAR BILJETTSLÄPP" to "Biljetter ute nu".

---

## 1. Regex-Only Extraction (Minimal Parse)

**Idea:** Don't parse the full JSON. Use a single regex to extract `ticketsOutNow` near `project-hail-mary`.

```python
match = re.search(r'project-hail-mary.{0,600}ticketsOutNow["\s]*:\s*(true|false)', html)
tickets_out = match.group(1) == 'true' if match else None
```

**Pros:** ~10x faster parse (0.5ms vs 6ms), no JSON overhead, minimal code  
**Cons:** Fragile if JSON structure changes (field order, escaping)  
**Use when:** Maximizing speed, willing to accept brittleness

---

## 2. Next.js `/_next/data/` Endpoint (JSON-Only Fetch)

**Idea:** Fetch pure JSON instead of HTML. Next.js exposes `/_next/data/{buildId}/program.json?list=upcoming`.

- Get `buildId` from page once (or cache it)
- Fetch JSON directly: ~560KB vs ~635KB HTML
- Parse JSON, navigate to `props.pageProps.programList.features`

**Pros:** No HTML/regex, cleaner data handling, same structure  
**Cons:** buildId can change on deployments; need to handle 404 and refetch buildId  
**Use when:** Prefer structured fetch over HTML scraping

---

## 3. GitHub Actions Scheduled Workflow

**Idea:** Run the check in the cloud on a schedule (e.g. every 15 min). No local process.

```yaml
# .github/workflows/check-tickets.yml
on:
  schedule:
    - cron: '*/15 * * * *'  # every 15 min
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -r requirements.txt
      - run: python check.py --monitor
      # On state change: commit new state, send notification (e.g. via email action)
```

**Pros:** No local machine, free tier, runs 24/7  
**Cons:** Needs notification integration (email, Discord webhook, etc.); 15-min minimum interval  
**Use when:** You want "set and forget" monitoring

---

## 4. Cloud Function / Serverless (e.g. AWS Lambda, Vercel Cron)

**Idea:** Deploy a small function that runs on a schedule, fetches the page, checks status, and sends a webhook/email.

**Pros:** Scalable, no local resources  
**Cons:** Setup effort, possible cold starts  
**Use when:** You already use cloud infra

---

## 5. Change Detection Service (UptimeRobot, ChangeDetection.io)

**Idea:** Use a service that monitors a URL for changes. Some support custom extraction (CSS/XPath/JSON path).

- **ChangeDetection.io:** Can watch for specific text changes
- **UptimeRobot:** HTTP monitor + alert; may need custom "keyword" check

**Pros:** No code to run, managed alerts  
**Cons:** May not support exact field extraction; paid plans for advanced features  
**Use when:** You want a no-code solution

---

## 6. Hash-Based Quick Check (Two-Phase)

**Idea:** Phase 1: Fetch page, extract only the ~100 chars containing `ticketsOutNow` for PHM, hash it. If hash unchanged, skip. Phase 2: If hash changed, do full parse and notify.

**Pros:** Avoids full parse on most runs when nothing changed  
**Cons:** Still need to fetch full page; hash comparison adds a small step  
**Use when:** Reducing CPU when polling frequently

---

## 7. Conditional HTTP Caching (ETag / Last-Modified)

**Idea:** Send `If-None-Match` or `If-Modified-Since` with each request. If server returns 304, skip processing.

**Pros:** Saves bandwidth and parse when page unchanged  
**Cons:** Many sites don't send useful cache headers for dynamic pages  
**Use when:** Server supports it (worth a quick test)

---

## 8. Browser Extension

**Idea:** Extension that runs when you visit biografspegeln.se, reads the page, and notifies if the status changed.

**Pros:** No polling, uses your existing session  
**Cons:** Only works when you visit the site, extension distribution  
**Use when:** You browse the site regularly anyway

---

## 9. Rely on Cinema/Ticketing Provider

**Idea:** If Biograf Spegeln or Prenly sends emails/newsletters when tickets go on sale, subscribe to that.

**Pros:** No scraping, official source  
**Cons:** May not be timely or movie-specific  
**Use when:** You want the simplest path

---

## 10. Adaptive Polling

**Idea:** Poll less often when far from release (e.g. weekly), more often when close (e.g. daily near March 2026).

**Pros:** Fewer requests overall  
**Cons:** More logic; risk of missing a very early release  
**Use when:** Combined with any fetch-based approach

---

## Comparison

| Solution | Efficiency | Complexity | Reliability | Best for |
|----------|------------|------------|-------------|----------|
| Regex-only | High | Low | Medium | Speed, minimal deps |
| _next/data | Medium | Medium | High | Clean JSON fetch |
| GitHub Actions | N/A | Medium | High | No local process |
| Cloud function | N/A | High | High | Cloud-native setup |
| Change detection | N/A | Low | Medium | No-code |
| Hash-based | Medium | Medium | High | Frequent polling |
| ETag | High* | Low | Low* | If server supports |
| Browser extension | High | Medium | Medium | Casual browser |
| Cinema newsletter | N/A | None | Low | Simplest |
| Adaptive polling | Medium | Low | High | Any fetch-based |

\* Only when server supports it

---

## Recommendation

- **For speed:** Regex-only (#1) or hash-based (#6)
- **For robustness:** Keep current `__NEXT_DATA__` + targeted path; optionally add `_next/data` (#2)
- **For zero local effort:** GitHub Actions (#3) or change detection service (#5)
- **For low effort:** Adaptive polling (#10) combined with current logic
