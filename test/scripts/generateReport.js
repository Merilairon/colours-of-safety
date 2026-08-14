const fs = require('fs');
const reporter = require('cucumber-html-reporter');

const jsonPath = 'reports/cucumber.json';
const outputPath = 'reports/index.html';

const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const precedence = ['failed', 'ambiguous', 'pending', 'undefined', 'skipped', 'passed'];

function worstStatus(statuses) {
  let worstIndex = Infinity;
  let worst = 'passed';
  for (const s of statuses) {
    const idx = precedence.indexOf(s);
    if (idx !== -1 && idx < worstIndex) {
      worstIndex = idx;
      worst = s;
    }
  }
  return worst;
}

for (const feature of report) {
  const elementStatuses = [];
  for (const element of feature.elements) {
    const stepStatuses = [];
    for (const step of element.steps) {
      step.result = step.result || { status: 'undefined', duration: 0 };
      stepStatuses.push(step.result.status);
    }
    element.status = worstStatus(stepStatuses);
    elementStatuses.push(element.status);
  }
  feature.status = worstStatus(elementStatuses);
}

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

reporter.generate({
  theme: 'bootstrap',
  jsonFile: jsonPath,
  output: outputPath,
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  metadata: {
    'App Version': '1.0.0',
    'Test Environment': process.env.BASE_URL || 'http://localhost:8080',
    Browser: process.env.BROWSER || 'chrome',
    Platform: process.platform,
  },
});

console.log(`HTML report written to ${outputPath}`);
