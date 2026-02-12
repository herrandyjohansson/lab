# Page Analysis: Biograf Spegeln – Ticket Button States

## Summary

The ticket button text is **derived from two JSON fields** in the `__NEXT_DATA__` payload:

| `ticketsOutNow` | `ticketsOnSale` | Button text |
|-----------------|-----------------|-------------|
| `False` | `null` / falsy | **INVÄNTAR BILJETTSLÄPP** |
| `False` | date string | **Biljetter** |
| `True` | any | **Biljetter ute nu** |

The transition you care about is: **INVÄNTAR BILJETTSLÄPP** → **Biljetter ute nu** when `ticketsOutNow` turns from `False` to `True`.

---

## Data source

**URL:** `https://biografspegeln.se/program?list=upcoming`

**Location in JSON:**

```
data.props.pageProps.programList.features[N]
```

Project Hail Mary is in `features[44]` (index may vary with layout). Each item has:

```json
{
  "id": 13725,
  "url": "https://biografspegeln.se/program/project-hail-mary",
  "isUpcoming": true,
  "premiereDate": "2026-03-20T00:00:00.000Z",
  "ticketsOnSale": null,
  "ticketsOutNow": false,
  "info": { "title": "Project Hail Mary", ... }
}
```

---

## How the button text is determined

The button text is not sent as a single string. It is computed from:

- `ticketsOutNow` → “Biljetter ute nu”
- `ticketsOnSale` (truthy) → “Biljetter”
- Otherwise → “INVÄNTAR BILJETTSLÄPP”

`check.py` reflects this in `get_ticket_status()`:

```python
def get_ticket_status(movie):
    tickets_out_now = movie.get("ticketsOutNow", False)
    tickets_on_sale = movie.get("ticketsOnSale")
    if tickets_out_now:
        return "Biljetter ute nu"
    if tickets_on_sale:
        return "Biljetter"
    return "INVÄNTAR BILJETTSLÄPP"
```

---

## Current state (as of analysis)

| Field | Value |
|-------|-------|
| `ticketsOutNow` | `false` |
| `ticketsOnSale` | `null` |
| Displayed status | **INVÄNTAR BILJETTSLÄPP** |

---

## When the button changes to “Biljetter ute nu”

When tickets are released, the API will change:

- `ticketsOutNow`: `false` → `true`

`check.py` will then:

1. Compute status as `"Biljetter ute nu"`
2. Detect a change in `extract_state()` (via `ticket_status`)
3. Trigger notifications in `run_monitor()` when `tickets_available` is true

---

## Validation

Other movies with `ticketsOutNow: true` (e.g. Elio, Sinners) show “Biljetter ute nu” in the page source. The `heroLink.name` values in the JSON match:

- `"Biljetter ute nu"`
- `"Biljetter"`
- `"Se meny"`

---

## Conclusion

- The correct source of truth is `ticketsOutNow` and `ticketsOnSale` in `programList.features`.
- The current `check.py` logic is correct for:
  - detecting the INVÄNTAR BILJETTSLÄPP state
  - detecting when it changes to “Biljetter ute nu”.
- No change is needed to the `get_ticket_status` logic to track this transition.
