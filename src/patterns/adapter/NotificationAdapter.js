/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 4: ADAPTER PATTERN                            ║
 * ║  File: src/patterns/adapter/NotificationAdapter.js              ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  The app currently has two incompatible notification systems:   ║
 * ║                                                                  ║
 * ║  A) Browser Notifications API (src/utils/notifications.js)      ║
 * ║     — uses Notification constructor, checks permission          ║
 * ║  B) In-App Toast system (each page has its own local toast)     ║
 * ║     — uses React setState with a {msg, type} object             ║
 * ║                                                                  ║
 * ║  The Adapter wraps both behind a single unified interface:      ║
 * ║     notificationAdapter.notify({ title, body, type })           ║
 * ║                                                                  ║
 * ║  This way, pages don't care whether they send a toast or a      ║
 * ║  browser notification — the adapter decides based on context.   ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → BillManager.jsx  — bill due/overdue alerts                   ║
 * ║  → UdhaarManager.jsx — udhaar overdue alerts                    ║
 * ║  → SubscriptionTracker.jsx — upcoming billing alerts            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ── Target interface (what the app wants to call) ─────────────────
// notify({ title, body, type, toastSetter })
//   title      — notification title (browser) / ignored for toast
//   body       — full message text
//   type       — "success" | "error" | "warning" | "info"
//   toastSetter — React setState function for in-app toast (optional)

// ── Adaptee A: Browser Notification API ──────────────────────────
class BrowserNotificationAdaptee {
  isSupported() {
    return "Notification" in window;
  }

  isGranted() {
    return Notification.permission === "granted";
  }

  async requestPermission() {
    if (!this.isSupported()) return false;
    if (this.isGranted()) return true;
    const perm = await Notification.requestPermission();
    return perm === "granted";
  }

  // Raw browser notification
  send(title, body, icon = "/favicon.svg") {
    if (!this.isGranted()) return false;
    new Notification(title, { body, icon });
    return true;
  }
}

// ── Adaptee B: In-App Toast system ───────────────────────────────
class ToastAdaptee {
  // toastSetter is the page-level setState(toast) function
  send(toastSetter, message, type = "success") {
    if (typeof toastSetter !== "function") return false;
    toastSetter({ msg: message, type });
    // Auto-dismiss after 3 seconds (matches existing page behaviour)
    setTimeout(() => toastSetter(null), 3000);
    return true;
  }
}

// ── Adapter: unified interface for both systems ───────────────────
class NotificationAdapter {
  #browserAdaptee;
  #toastAdaptee;

  constructor() {
    this.#browserAdaptee = new BrowserNotificationAdaptee();
    this.#toastAdaptee   = new ToastAdaptee();
  }

  /**
   * notify — unified notification method.
   *
   * @param {object} options
   * @param {string}   options.title        — used for browser notifications
   * @param {string}   options.body         — message text
   * @param {string}   [options.type]       — "success"|"error"|"warning"|"info"
   * @param {function} [options.toastSetter]— React setState for in-app toast
   * @param {boolean}  [options.browserOnly]— skip toast, only browser notification
   * @param {boolean}  [options.toastOnly]  — skip browser, only toast
   */
  notify({ title, body, type = "success", toastSetter, browserOnly = false, toastOnly = false }) {
    let sent = false;

    // Send in-app toast if setter provided and not browser-only
    if (!browserOnly && toastSetter) {
      sent = this.#toastAdaptee.send(toastSetter, body, type);
    }

    // Send browser notification if granted and not toast-only
    if (!toastOnly && this.#browserAdaptee.isGranted()) {
      sent = this.#browserAdaptee.send(title, body) || sent;
    }

    return sent;
  }

  /**
   * notifyDueItems — adapts the raw Firestore items array into
   * structured notifications (replaces checkAndShowNotifications).
   *
   * @param {Array}    items       — Firestore records (udhaar / bills)
   * @param {string}   moduleType  — "udhaar" | "bill"
   * @param {function} [toastSetter]
   */
  notifyDueItems(items, moduleType, toastSetter) {
    if (!Array.isArray(items)) return;

    const todayStr  = new Date().toISOString().split("T")[0];
    const cacheKey  = `notified_${moduleType}_${todayStr}`;
    let   shownIds  = [];

    try { shownIds = JSON.parse(localStorage.getItem(cacheKey) || "[]"); }
    catch { shownIds = []; }

    const now = new Date();

    items.forEach(item => {
      if (!item.dueDate || item.status === "paid" || item.settled === true) return;
      if (shownIds.includes(item.id)) return;

      const due       = new Date(item.dueDate);
      const daysUntil = Math.ceil((due - now) / 86400000);

      if (daysUntil <= 0) {
        const isOverdue = daysUntil < 0;
        const label     = moduleType === "bill"
          ? `${isOverdue ? "Overdue" : "Due Today"}: ${item.provider} Bill`
          : `${isOverdue ? "Overdue" : "Due Today"}: Udhaar from ${item.name}`;

        const body = `Amount: PKR ${item.amount} | Due: ${item.dueDate}`;

        // Route through adapter
        this.notify({
          title: label,
          body: `${label} — ${body}`,
          type: isOverdue ? "error" : "warning",
          toastSetter,
        });

        shownIds.push(item.id);
      }
    });

    localStorage.setItem(cacheKey, JSON.stringify(shownIds));
  }

  // Delegate permission request to browser adaptee
  async requestPermission() {
    return this.#browserAdaptee.requestPermission();
  }
}

// ── Export a single shared adapter instance ───────────────────────
const notificationAdapter = new NotificationAdapter();
export default notificationAdapter;
