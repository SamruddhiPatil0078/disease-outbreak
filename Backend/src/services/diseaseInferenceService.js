// services/diseaseInferenceService.js

function inferDiseaseProbabilities(records) {
  let totals = {};
  let totalCases = 0;

  records.forEach((r) => {
    const disease = (r.disease || "unknown").toLowerCase();

    // ✅ SAFE CASE HANDLING
    const cases = Number(r.no_of_cases || r.cases) || 0;

    if (!totals[disease]) totals[disease] = 0;

    totals[disease] += cases;
    totalCases += cases;
  });

  let probs = {};
  const numDiseases = Object.keys(totals).length;

  for (let d in totals) {
    probs[d] =
      totalCases > 0
        ? (totals[d] + 1) / (totalCases + numDiseases) // smoothing
        : 0;
  }

  return probs;
}

module.exports = { inferDiseaseProbabilities };