/**
 * FEATURE: Vault Strength Meter
 * Computes a 0–100 score from existing Firestore data.
 * Pure client-side — no extra reads needed.
 */

export function computeVaultStrength({ assets, nominees, medicalForm, emergencyCard, netWorthAssets }) {
  const checks = [
    // Vault
    { label: "At least 1 vault item added",        done: (assets?.length ?? 0) > 0,        points: 15 },
    { label: "3+ vault items for good coverage",   done: (assets?.length ?? 0) >= 3,        points: 10 },
    // Contacts
    { label: "At least 1 trusted contact",         done: (nominees?.length ?? 0) > 0,       points: 15 },
    { label: "2+ trusted contacts",                done: (nominees?.length ?? 0) >= 2,       points: 5  },
    // Medical
    { label: "Blood group recorded",               done: !!medicalForm?.bloodGroup,          points: 10 },
    { label: "Medical passport filled",            done: !!medicalForm?.conditions?.trim(),  points: 10 },
    // Emergency
    { label: "Emergency card has ICE contact",     done: !!emergencyCard?.emergencyContact,  points: 15 },
    { label: "Emergency card has blood group",     done: !!emergencyCard?.bloodGroup,        points: 5  },
    // Net worth
    { label: "Net worth tracked",                  done: (netWorthAssets ?? []).some(a => a.value > 0), points: 15 },
  ];

  const score    = checks.reduce((sum, c) => sum + (c.done ? c.points : 0), 0);
  const maxScore = checks.reduce((sum, c) => sum + c.points, 0);
  const pct      = Math.round((score / maxScore) * 100);

  const pending = checks.filter(c => !c.done).map(c => c.label);

  const grade =
    pct >= 90 ? { label: "Excellent", color: "#10B981" } :
    pct >= 70 ? { label: "Good",      color: "#22C55E" } :
    pct >= 50 ? { label: "Fair",      color: "#F59E0B" } :
               { label: "Weak",       color: "#EF4444" };

  return { score: pct, grade, pending };
}
