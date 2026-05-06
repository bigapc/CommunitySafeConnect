# Escalation Review Workflow - Testing Guide

This guide walks through end-to-end testing of the escalation management review workflow, including priority-based sorting, owner assignment, and SLA verification call scheduling.

## Test Data Overview

Six escalation requests have been seeded with different categories and statuses:

### Active (Unresolved) Escalations

#### Critical Priority (Should appear first)
1. **Legal Coordination** (120 min old)
   - ID: esc_*
   - Contact: Margaret Chen (m.chen@example.com)
   - Reason: Legal counsel needed for ongoing investigation
   - Status: `submitted` → Not assigned yet
   - Expected: Should sort FIRST (critical + oldest = highest urgency)

2. **Sensitive Compliance** (90 min old)
   - ID: esc_*
   - Contact: James Rodriguez (j.rodriguez@example.com)
   - Reason: GDPR data deletion request
   - Status: `submitted` → Not assigned yet
   - Expected: Should sort SECOND (critical + slightly newer)

#### High Priority (Should appear second)
3. **Exceptional Data Review** (45 min old)
   - ID: esc_*
   - Contact: Patricia Wilson (p.wilson@example.com)
   - Reason: Access to archived messages from restricted zone
   - Status: `submitted` → Not assigned yet
   - Expected: Should sort THIRD (high priority)

4. **Redaction Review** (30 min old)
   - ID: esc_*
   - Contact: Michael Torres (m.torres@example.com)
   - Reason: Sensitive content redaction needed
   - Status: `under_review` → **ALREADY ASSIGNED TO**: Sarah_Kim_ComplianceLead
   - Verification Call: Scheduled for ~2 hours from now
   - Expected: Should sort FOURTH (high priority + assigned = awaiting-schedule SLA)

#### Standard Priority (Should appear last among active)
5. **Restricted Access Review** (15 min old)
   - ID: esc_*
   - Contact: Emily Jackson (e.jackson@example.com)
   - Reason: Temporary elevated access for incident investigation
   - Status: `submitted` → Not assigned yet
   - Expected: Should sort LAST (standard priority + newest)

### Resolved (Closed) Escalations

6. **Restricted Access Review** (600 min old, resolved 120 min ago)
   - Contact: David Kim (d.kim@example.com)
   - Assigned To: James_Wong_OpsDirector
   - Verification Call: Completed ~480 min ago
   - Resolution Notes: "Access approved for 8-hour window, verified and revoked."
   - Expected: Shows in "Resolved Archive" section at bottom

---

## Test Scenario 1: Verify Priority-Based Sorting

**Objective**: Confirm escalations appear in priority order on the escalations page.

### Steps

1. **Navigate to Escalations Page**
   - URL: `http://localhost:3000/command-center/escalations`
   - You should see a page titled "Escalation Management"

2. **Examine Summary Row** (top of Active section)
   - Look for priority pills: **Critical: 2 | High: 2 | Standard: 1**
   - Look for SLA pills: **Awaiting Schedule: 1 | Tracked: 4**
   - Count should match: 5 active escalations total

3. **Verify Sort Order in "Active Requests" List**
   - **1st card**: Legal Coordination (Margaret Chen) — should have 🔴 **Critical** badge
   - **2nd card**: Sensitive Compliance (James Rodriguez) — should have 🔴 **Critical** badge
   - **3rd card**: Exceptional Data Review (Patricia Wilson) — should have 🟡 **High** badge
   - **4th card**: Redaction Review (Michael Torres) — should have 🟡 **High** badge
     - This one already shows owner: "Sarah_Kim_ComplianceLead"
     - Shows Verification Call scheduled in ~2 hours
     - Has 📅 **Awaiting Schedule** SLA badge
   - **5th card**: Restricted Access Review (Emily Jackson) — should have ⚫ **Standard** badge

**✅ Test Passes If**: Cards appear in this exact priority order (critical first, then high, then standard).

---

## Test Scenario 2: Assign Owner to Critical Legal Case

**Objective**: Test the end-to-end workflow for assigning ownership and scheduling verification.

### Steps

1. **Locate the Legal Coordination Escalation**
   - Find card with Margaret Chen / Legal Coordination reason
   - Should be marked 🔴 **Critical**
   - Should currently show "Not assigned"

2. **Scroll Down in Card to Inline Review Form**
   - You'll see a form with fields:
     - **Assign To** (text input)
     - **Verification Call At** (datetime input)
     - **Status** (dropdown: submitted | under_review | resolved)
     - **Review** button

3. **Fill Ownership Assignment**
   - Click "Assign To" field
   - Type: `Robert_Petersen_LegalDept`
   - Tab to next field

4. **Schedule Verification Call**
   - Click "Verification Call At" datetime field
   - Set to 1 hour from now (e.g., if current time is 14:30, set to 15:30)
   - Example format: Today at 3:30 PM

5. **Change Status** (optional but recommended)
   - Click Status dropdown
   - Select `under_review` (shows you're taking action)

6. **Submit the Form**
   - Click **Review** button
   - Page will redirect back to escalations page

7. **Verify Changes Persisted**
   - Look for the Legal Coordination card again (should still be 1st)
   - Confirm it now shows:
     - Assigned To: `Robert_Petersen_LegalDept`
     - Verification Call time showing
     - Status: `under_review`
   - 📅 SLA badge should change from **Tracked** to **Awaiting Schedule** (if call is in future)

**✅ Test Passes If**: Form submits without error, page reloads, and assigned name + call time appear on the card.

---

## Test Scenario 3: Verify SLA State Changes

**Objective**: Confirm SLA classification updates based on verification call timestamp.

### Steps

1. **After assigning owner to Legal Coordination case**
   - Reload the page (F5)
   - Escalation should still show with owner assigned

2. **Check SLA Badge**
   - Before verification call was scheduled: Status was **Tracked** (blue badge)
   - After scheduling: Status should be **Awaiting Schedule** (amber badge)
   - This indicates leadership has committed to a verification call

3. **Compare to Other Cases**
   - Redaction Review (already assigned): Shows 📅 **Awaiting Schedule** (was assigned earlier)
   - Unassigned Legal/Compliance cases: Still show **Tracked** (no call scheduled yet)

4. **Simulate Overdue** (optional advanced test)
   - Open browser dev console (F12)
   - Navigate to Application tab → Local Storage
   - Find escalation with very old `verification_call_at` (e.g., 2 hours ago)
   - That escalation should show 🔴 **Overdue** badge instead of Awaiting Schedule

**✅ Test Passes If**: SLA badges update correctly based on verification call timestamp relative to current time.

---

## Test Scenario 4: Persistence Across Page Reloads

**Objective**: Ensure ownership assignments and call scheduling persist in the local data store.

### Steps

1. **Note Down Assignment Details**
   - Record the escalation ID (visible in card or form)
   - Record assigned name and verification call time

2. **Navigate Away and Back**
   - Click back to Command Center Overview: `/command-center/overview`
   - Confirm you see the escalations queue preview with updated counts
   - Click forward to Escalations page again: `/command-center/escalations`

3. **Verify Data Persisted**
   - The assignment you made should still be visible
   - Owner name should still be shown
   - Verification call time should still be displayed
   - Status should still be `under_review`

4. **Hard Browser Refresh** (Shift+Reload / Ctrl+Shift+R)
   - Hard refresh the page (bypasses cache)
   - Escalation should STILL show the assignment
   - This confirms data is in the in-memory store, not just client-side DOM

**✅ Test Passes If**: Data persists after navigation and hard refresh.

---

## Test Scenario 5: Review Page Priority Metrics

**Objective**: Verify priority counts at top of Active section match actual escalations.

### Steps

1. **On Escalations Page, Look at Summary Row**
   - You should see priority pill row showing:
     - 🔴 **Critical: 2** (Legal + Sensitive Compliance)
     - 🟡 **High: 2** (Exceptional Data + Redaction Review)
     - ⚫ **Standard: 1** (Restricted Access - Emily Jackson)

2. **Count Escalations Below by Priority**
   - Count how many have 🔴 Critical badge → should be 2
   - Count how many have 🟡 High badge → should be 2
   - Count how many have ⚫ Standard badge → should be at least 1
   - Total active should be ≥ 5

3. **Check SLA Summary**
   - Should show pill counts for: Overdue | Due Soon | Awaiting Schedule | Tracked
   - Most should be "Tracked" (not yet due)
   - One should be "Awaiting Schedule" (Redaction Review with assigned call)

**✅ Test Passes If**: Priority pill counts match escalations below.

---

## Test Scenario 6: Resolved Archive

**Objective**: Verify resolved escalations appear in read-only archive below.

### Steps

1. **Scroll to Bottom of Page**
   - Find "Resolved Archive" section
   - Should show 1 escalation: David Kim / Restricted Access Review

2. **Verify Read-Only Display**
   - Card should show:
     - Contact: David Kim
     - Category: Restricted Access Review
     - Assigned To: James_Wong_OpsDirector
     - Resolution Notes: "Access approved for 8-hour window, verified and revoked."
   - No edit form should be visible (it's resolved)

3. **Filter by Status** (if implemented)
   - Try status search/filter for "resolved"
   - Should show only resolved escalations
   - Use status filter for "submitted" → should show only unassigned cases

**✅ Test Passes If**: Resolved archive displays correctly and no edit form is shown.

---

## Troubleshooting

### Issue: Escalations page shows "No active escalations"
- **Cause**: Seed data didn't load (old dev server cache)
- **Fix**: Kill dev server (Ctrl+C), restart with `npm run dev`, hard refresh browser

### Issue: Form submission shows error / Page doesn't redirect
- **Cause**: Missing required fields or validation error
- **Fix**: Check browser console (F12) for error message; ensure all fields filled correctly

### Issue: Assigned owner doesn't persist after reload
- **Cause**: Local store may have cleared or form submission failed silently
- **Fix**: Check browser Network tab (F12) → ensure POST to `/api/command-center/escalation/[id]/review` returned 200/307

### Issue: SLA badges show wrong state
- **Cause**: Verification call datetime may be in past or future unexpectedly
- **Fix**: Check the exact timestamp stored; system uses ISO 8601 format

---

## Next Steps After Testing

1. ✅ **If all tests pass**: Priority weighting system is working end-to-end
2. 🔄 **Consider adding**:
   - Escalation comments for audit trail
   - Reassignment capability (transfer owner)
   - Client-side notifications on status change
3. 📊 **Performance**: Test with 50+ escalations to verify sort performance
4. 🔒 **Access control**: Verify moderator (and above) can review/assign

---

## Test Data Reset

To reset to fresh seed data:
```bash
# Kill dev server (Ctrl+C in terminal)
# Or:
npm run build && npm run dev
```

Seed data will regenerate on first page load if `escalationRequests.length === 0`.
