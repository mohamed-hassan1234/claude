const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const SurveyResponse = require('../models/SurveyResponse');
const { flattenResponsesForAnalytics } = require('./exportService');
const { buildResponseQuery } = require('./queryService');

const runPythonAnalytics = async (filters = {}) => {
  const query = buildResponseQuery(filters);
  const responses = await SurveyResponse.find(query).populate('sector', 'name').lean();
  const rows = await flattenResponsesForAnalytics(responses);

  const tempFile = path.join(os.tmpdir(), `cloud-survey-${Date.now()}.json`);
  await fs.writeFile(tempFile, JSON.stringify(rows), 'utf8');

  const configuredScript = process.env.ANALYTICS_SCRIPT_PATH || '../analytics/analyze.py';
  const scriptPath = path.isAbsolute(configuredScript)
    ? configuredScript
    : path.resolve(__dirname, '..', configuredScript);
  const pythonPath = process.env.PYTHON_PATH || 'python';

  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [scriptPath, tempFile], { cwd: path.resolve(__dirname, '..') });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', async (code) => {
      await fs.unlink(tempFile).catch(() => {});

      if (code !== 0) {
        return reject(new Error(stderr || 'Python analytics failed'));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Analytics returned invalid JSON: ${error.message}`));
      }
    });
  });
};

module.exports = { runPythonAnalytics };
