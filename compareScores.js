function compareScores(previous, current) {
  const modules = {};
  let previousTotal = 0;
  let currentTotal = 0;
  let count = 0;

  const allKeys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(current || {})
  ]);

  for (const key of allKeys) {
    const prevScore = previous?.[key]?.score ?? null;
    const currScore = current?.[key]?.score ?? null;

    const change = (prevScore !== null && currScore !== null)
      ? +(currScore - prevScore).toFixed(2)
      : null;

    modules[key] = {
      previous: prevScore,
      current: currScore,
      change
    };

    if (currScore !== null) {
      currentTotal += currScore;
      count++;
    }
    if (prevScore !== null) {
      previousTotal += prevScore;
    }
  }

  const previousAverage = +(previousTotal / count).toFixed(2);
  const currentAverage = +(currentTotal / count).toFixed(2);
  const overallChange = +(currentAverage - previousAverage).toFixed(2);

  return {
    previous_average: previousAverage,
    current_average: currentAverage,
    overall_change: overallChange,
    modules
  };
}
