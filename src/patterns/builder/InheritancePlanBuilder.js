/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 3: BUILDER PATTERN                            ║
 * ║  File: src/patterns/builder/InheritancePlanBuilder.js           ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  Constructs complex InheritancePlan objects step-by-step with   ║
 * ║  a fluent (chainable) API. Each setter returns `this` so you    ║
 * ║  can chain calls and call .build() at the end.                  ║
 * ║                                                                  ║
 * ║  WHY IT'S NEEDED HERE:                                           ║
 * ║  In Inheritance.jsx the plan object is built by spreading state ║
 * ║  across 3 separate steps with no validation between them.       ║
 * ║  The builder enforces required fields, validates total          ║
 * ║  percentage = 100, and prevents invalid plan objects from being ║
 * ║  saved to Firestore.                                             ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → Inheritance.jsx: handleSave() now uses the builder           ║
 * ║    to validate and assemble the payload before calling          ║
 * ║    addInheritancePlan / updateInheritancePlan.                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

class InheritancePlanBuilder {
  constructor() {
    this.#reset();
  }

  // ── Internal plan object ──────────────────────────────────────────
  #plan = {};
  #errors = [];

  #reset() {
    this.#plan = {
      assetId:       "",
      assetTitle:    "",
      assetCategory: "other",
      totalValue:    0,
      currency:      "PKR",
      delayDays:     0,
      beneficiaries: [],
      status:        "active",
    };
    this.#errors = [];
  }

  // ── Step 1: Asset details ─────────────────────────────────────────
  setAsset(assetId, assetTitle, assetCategory = "other") {
    if (!assetId || !assetTitle) {
      this.#errors.push("Asset ID and title are required.");
    }
    this.#plan.assetId       = assetId;
    this.#plan.assetTitle    = assetTitle;
    this.#plan.assetCategory = assetCategory;
    return this; // fluent — return `this` for chaining
  }

  // ── Step 2: Value and currency ────────────────────────────────────
  setValue(totalValue, currency = "PKR") {
    const val = Number(totalValue) || 0;
    if (val < 0) {
      this.#errors.push("Total value cannot be negative.");
    }
    this.#plan.totalValue = val;
    this.#plan.currency   = currency;
    return this;
  }

  // ── Step 3: Release timeline ──────────────────────────────────────
  setDelay(delayDays = 0) {
    const validOptions = [0, 7, 30, 90, 180, 365];
    if (!validOptions.includes(Number(delayDays))) {
      this.#errors.push(`Delay must be one of: ${validOptions.join(", ")} days.`);
    }
    this.#plan.delayDays = Number(delayDays);
    return this;
  }

  // ── Step 4: Add a single beneficiary ─────────────────────────────
  addBeneficiary({ nomineeId, nomineeName, relation, percentage }) {
    if (!nomineeId || !nomineeName) {
      this.#errors.push("Each beneficiary must have a nominee ID and name.");
    }
    const pct = Number(percentage) || 0;
    if (pct < 0 || pct > 100) {
      this.#errors.push(`Percentage for ${nomineeName} must be between 0 and 100.`);
    }
    this.#plan.beneficiaries.push({ nomineeId, nomineeName, relation, percentage: pct });
    return this;
  }

  // ── Step 4 (bulk): Set entire beneficiaries array ─────────────────
  setBeneficiaries(beneficiariesArray) {
    this.#plan.beneficiaries = [];
    (beneficiariesArray || []).forEach(b => this.addBeneficiary(b));
    return this;
  }

  // ── Final step: Build & validate ──────────────────────────────────
  build() {
    // Validate: at least one beneficiary
    if (this.#plan.beneficiaries.length === 0) {
      this.#errors.push("At least one beneficiary is required.");
    }

    // Validate: total percentage must equal 100
    const totalPct = this.#plan.beneficiaries.reduce(
      (sum, b) => sum + (b.percentage || 0), 0
    );
    if (totalPct !== 100) {
      this.#errors.push(
        `Beneficiary percentages must total 100%. Current total: ${totalPct}%.`
      );
    }

    // Validate: asset must be selected
    if (!this.#plan.assetId) {
      this.#errors.push("An asset must be selected.");
    }

    // If any errors accumulated, throw with all messages
    if (this.#errors.length > 0) {
      const msg = this.#errors.join(" | ");
      this.#reset();
      throw new Error(`[InheritancePlanBuilder] Validation failed: ${msg}`);
    }

    // Deep clone to prevent mutations of internal state
    const result = JSON.parse(JSON.stringify(this.#plan));
    this.#reset(); // ready for next build
    return result;
  }

  // ── Utility: build without validation (for drafts) ────────────────
  buildDraft() {
    const result = JSON.parse(JSON.stringify(this.#plan));
    this.#reset();
    return result;
  }

  // ── Static factory method for quick reconstruction ────────────────
  static fromExisting(plan) {
    const builder = new InheritancePlanBuilder();
    builder.setAsset(plan.assetId, plan.assetTitle, plan.assetCategory);
    builder.setValue(plan.totalValue, plan.currency);
    builder.setDelay(plan.delayDays);
    builder.setBeneficiaries(plan.beneficiaries);
    return builder;
  }
}

export default InheritancePlanBuilder;
