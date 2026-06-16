/**
 * Small live benchmark of candidate Groq chat models for the schedule AI
 * assistant. Intentionally tiny (few models x few prompts, capped tokens, with
 * a delay between calls) to avoid hitting Groq rate limits.
 *
 * Run: npm run benchmark:model
 * Writes: documention/model-benchmark-result.json
 *
 * Only general-purpose chat LLMs from the available Groq model list are
 * benchmarked. Audio (whisper-*), TTS (orpheus/*), and safety-classifier models
 * (llama-prompt-guard-*, *-safeguard-*) are excluded — they cannot serve as the
 * assistant's conversational model.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const Groq = require('groq-sdk');
const { GROQ_API_KEY, DEFAULT_MODEL } = require('../config/config');
const { generatePrompt } = require('../helper');

const CANDIDATE_MODELS = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-20b',
    'qwen/qwen3-32b',
];

// Representative ground data (a small week) so the prompt matches production use.
const groundData = {
    user: { firstName: 'Микита', lastName: 'Гавриленко' },
    group: { name: 'ІП-21' },
    currentWeek: {
        staticWeek: [
            {
                day: 'Пн',
                events: [{
                    eventInfo: {
                        name: 'Бази даних', teacherName: 'Іваненко І.І.', place: '301', platform: 'Zoom'
                    },
                    eventDate: { time: '10:00', duration: 95 },
                },],
            },
            {
                day: 'Ср',
                events: [{
                    eventInfo: {
                        name: 'Алгоритми', teacherName: 'Петренко П.П.', place: '210', platform: 'Offline'
                    },
                    eventDate: { time: '12:20', duration: 95 },
                },],
            },
        ],
    },
};

const PROMPTS = [
    'Яка перша пара в понеділок і де вона проходить?',
    'Скільки пар у мене цього тижня та які предмети?',
];

const MAX_TOKENS = 256;
const DELAY_MS = 900; // gentle pacing between requests to respect rate limits

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
    if (!GROQ_API_KEY || !GROQ_API_KEY.trim()) {
        // eslint-disable-next-line no-console
        console.error('GROQ_API_KEY is not set — cannot run the live benchmark.');
        process.exit(1);
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const results = [];

    for (const model of CANDIDATE_MODELS) {
        const runs = [];
        let failed = null;

        for (const question of PROMPTS) {
            const prompt = generatePrompt.questionWithData(question, groundData);
            const start = Date.now();
            try {
                // eslint-disable-next-line no-await-in-loop
                const completion = await groq.chat.completions.create({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: MAX_TOKENS,
                    temperature: 0.3,
                });
                const latencyMs = Date.now() - start;
                const usage = completion.usage || {};
                const text = completion.choices[0]?.message?.content || '';
                const completionTokens = usage.completion_tokens || 0;
                runs.push({
                    latencyMs,
                    promptTokens: usage.prompt_tokens || 0,
                    completionTokens,
                    totalTokens: usage.total_tokens || 0,
                    tokensPerSec: completionTokens ? Number((completionTokens / (latencyMs / 1000)).toFixed(1)) : 0,
                    sample: text.slice(0, 160).replace(/\s+/g, ' ').trim(),
                });
            } catch (e) {
                failed = e.message || String(e);
                break;
            }
            // eslint-disable-next-line no-await-in-loop
            await sleep(DELAY_MS);
        }

        if (failed) {
            // eslint-disable-next-line no-console
            console.log(`\n### ${model} — ERROR: ${failed}`);
            results.push({ model, error: failed });
            continue;
        }

        const avg = (key) => Number((runs.reduce((s, r) => s + r[key], 0) / runs.length).toFixed(1));
        const summary = {
            model,
            isCurrentDefault: model === DEFAULT_MODEL,
            runs: runs.length,
            avgLatencyMs: avg('latencyMs'),
            avgCompletionTokens: avg('completionTokens'),
            avgTokensPerSec: avg('tokensPerSec'),
            samples: runs.map((r) => r.sample),
        };
        results.push(summary);

        // eslint-disable-next-line no-console
        console.log(`\n### ${model}${summary.isCurrentDefault ? '  (CURRENT DEFAULT)' : ''}`);
        // eslint-disable-next-line no-console
        console.log(`avg latency: ${summary.avgLatencyMs} ms | avg tokens/sec: ${summary.avgTokensPerSec} | avg completion tokens: ${summary.avgCompletionTokens}`);
        // eslint-disable-next-line no-console
        console.log(`sample: ${runs[0].sample}`);
    }

    const outPath = path.join(__dirname, '..', 'documention', 'model-benchmark-result.json');
    const payload = {
        generatedAt: new Date().toISOString(),
        config: { maxTokens: MAX_TOKENS, promptsPerModel: PROMPTS.length, delayMs: DELAY_MS },
        currentDefaultModel: DEFAULT_MODEL,
        results,
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    // eslint-disable-next-line no-console
    console.log(`\nSaved results to ${outPath}`);
})();
