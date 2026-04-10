const fs = require("fs");
const readline = require("readline");

const parseCSV = async (filePath) => {
  const results = [];

  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const values = line.split(",");

    // ✅ HANDLE EXACT FORMAT: area, city, date, disease, cases
    if (values.length === 5) {
      const [area, city, date, disease, cases] = values;

      const casesValue = parseInt(cases);

      if (!isNaN(casesValue)) {
        results.push({
          area: area.trim(),
          city: city.trim(),
          date: new Date(date.trim()),
          disease: disease.trim().toLowerCase(),
          cases: casesValue,
        });
      }
    }
  }

  console.log("🔥 FINAL PARSED SAMPLE:", results[0]);

  return results;
};

module.exports = { parseCSV };