# Widget Duplicates & Consolidation

## Summary

- **Remove / clean up:** Google Calendar (already deprecated in UI).
- **Optional consolidation:** None required; a couple of optional product tweaks below.
- **No duplicates:** Other widgets serve distinct use cases.

---

## 1. Google Calendar — remove from “addable” surfaces

**Status:** Effectively deprecated. The dashboard already renders: *“Google Calendar widget has been removed. You can delete this widget.”*

**Why:** The widget type still exists so existing instances don’t break, but it’s no longer a real feature.

**Done:**
- Removed **Google Calendar** from the preset library so new presets can’t include it.
- It remains in the schema and in the dashboard `renderWidgetContent` switch so existing `google_calendar` widgets still show the “removed” message and can be deleted by the user.

**Optional next steps:**
- Stop mentioning “Google Calendar” in marketing (pricing, landing) and say “Embed” or “Embed external tools” instead, or “Embed your calendar via the Embed widget.”
- Later, if you want to drop the type entirely: add a one-time migration that converts existing `google_calendar` widgets to `iframe` with the user’s embed URL (if stored), then remove `google_calendar` from the schema and all switches.

---

## 2. AI Chat vs Embed (iframe)

**Overlap:** Both can show an external URL (e.g. ChatGPT). Embed = any URL; AI Chat = same idea with presets and a dedicated label.

**Recommendation:** **Keep both.**  
- **Embed:** “Embed any website” — generic.  
- **AI Chat:** “Embed your favorite AI assistant” — clearer for non-technical users and better for marketing.  

No code consolidation needed. Optionally, add **AI Chat** to the main Add Widget grid (it’s currently only in the Template Library) so users can add it without opening the preset library.

---

## 3. Weekly Scorecard vs KPI Dashboard

**Overlap:** Both show “metrics” (numbers vs targets).

**Difference:**
- **Weekly Scorecard:** Weekly target vs actual, trend (up/down vs last week), multiple metrics.
- **KPI Dashboard:** Single target per KPI, progress bar, green/yellow/red by % of target.

**Recommendation:** **Keep both.** Different use cases (weekly cadence + trend vs ongoing KPI progress). Consolidating into one “Metrics” widget with two modes would be a larger product/UX change and isn’t necessary to remove duplication.

---

## 4. Notes vs Daily Journal vs Quick Capture

**Notes:** Rich text / markdown; many notes; color picker.  
**Daily Journal:** One entry per day; date navigation; auto-save.  
**Quick Capture:** Inbox list; mark done; process later.

**Recommendation:** **Keep all three.** Different workflows (free-form notes vs dated journal vs inbox). No consolidation needed.

---

## 5. Code Block vs Custom

**Code Block:** User edits HTML/JS and sees live preview (snippets, experiments).  
**Custom:** Runs pre-built or AI-generated HTML (templates, AI Widget Builder).

**Recommendation:** **Keep both.** One is “edit code here”; the other is “run this widget.” Not duplicates.

---

## Current widget count (after cleanup)

- **Schema / types:** 21 (including `google_calendar` for backward compatibility; not offered in preset library).
- **Add Widget dialog:** 18 (no Google Calendar, no AI Chat, no Custom — Custom is added via “Build with AI,” AI Chat via Template Library).
- **Preset library:** 19 (Google Calendar removed from the list so new presets don’t include it).

No other duplicate widgets identified; no further removals or consolidations required unless you choose the optional product tweaks above.
