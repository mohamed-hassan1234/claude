const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const SurveyResponse = require('../models/SurveyResponse');
const { flattenResponsesForAnalytics } = require('./exportService');
const { buildCompatibleResponseQuery } = require('./queryService');
const { buildLocalAnalytics } = require('./localAnalyticsService');
const { normalizeResponseSectors } = require('./responseCompatibilityService');

const logAnalyticsServiceError = (scope, error, metadata = {}) => {
  const message = error?.message || 'Unknown analytics error';
  console.error(`[AnalyticsService:${scope}] ${message}`, metadata);
  if (error?.stack) {
    console.error(error.stack);
  }
};

const runPythonAnalyticsProcess = async (rows) => {
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
    let settled = false;

    const finish = async (handler, value) => {
      if (settled) return;
      settled = true;
      await fs.unlink(tempFile).catch(() => {});
      handler(value);
    };

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish(reject, new Error(`Unable to start Python analytics: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return finish(reject, new Error(stderr || 'Python analytics failed'));
      }

      try {
        return finish(resolve, JSON.parse(stdout));
      } catch (error) {
        return finish(reject, new Error(`Analytics returned invalid JSON: ${error.message}`));
      }
    });
  });
};

const runPythonAnalytics = async (filters = {}) => {
  let rows = [];

  try {
    const query = await buildCompatibleResponseQuery(filters);
    const responses = await normalizeResponseSectors(await SurveyResponse.find(query).lean());
    rows = await flattenResponsesForAnalytics(responses);
  } catch (error) {
    logAnalyticsServiceError('prepare', error, { filters });
    throw error;
  }

  try {
    return await runPythonAnalyticsProcess(rows);
  } catch (error) {
    console.warn(`Python analytics failed, using local fallback: ${error.message}`);
    return buildLocalAnalytics(rows);
  }
};

module.exports = { runPythonAnalytics };
