#!/usr/bin/env node
/**
 * Daily Puzzle Generator for QuranIQ
 * Uses MIMO AI to generate daily puzzles
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const MIMO_API_KEY = process.env.MIMO_API_KEY;
const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1';
const MIMO_MODEL = 'xiaomi/mimo-v2-flash';

const DATA_DIR = path.join(__dirname, '..', 'data');

// Get today's date
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// Sleep helper
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Call MIMO API
async function callMIMO(prompt) {
  if (!MIMO_API_KEY) {
    throw new Error('MIMO_API_KEY not set');
  }

  const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MIMO_API_KEY}`
    },
    body: JSON.stringify({
      model: MIMO_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
      reasoning: { enabled: true }
    })
  });

  if (!response.ok) {
    throw new Error(`MIMO API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// Generate Connections puzzle
async function generateConnectionsPuzzle() {
  console.log('[Connections] Generating puzzle...');

  const prompt = `Create a Quran-themed "Connections" style puzzle. This is a word grouping game where players must find 4 groups of 4 related words each.

Rules:
1. Create exactly 4 categories
2. Each category must have exactly 4 Arabic words/phrases from the Quran
3. Each word must be a genuine Quranic word with a verse reference
4. Categories should be thematically related (e.g., "Names of Allah", "Prophets", "Places in Paradise", etc.)
5. Make it challenging but solvable

For each item, provide:
- ar: The Arabic word/phrase
- en: English translation
- ref: Verse reference (e.g., "2:255")
- verse: Full Arabic verse text
- verseEn: English translation of the verse

Colors for categories (in order): yellow, green, blue, purple

Respond with ONLY this JSON format:
{
  "categories": [
    {
      "name": "Arabic category name",
      "nameEn": "English category name",
      "color": "yellow|green|blue|purple",
      "items": [
        {"ar": "...", "en": "...", "ref": "...", "verse": "...", "verseEn": "..."}
      ]
    }
  ]
}`;

  try {
    const content = await callMIMO(prompt);
    const cleaned = content.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const puzzle = JSON.parse(cleaned);

    // Validate structure
    if (!puzzle.categories || puzzle.categories.length !== 4) {
      throw new Error('Invalid puzzle structure');
    }

    for (const cat of puzzle.categories) {
      if (!cat.items || cat.items.length !== 4) {
        throw new Error('Category missing items');
      }
    }

    console.log('[Connections] Generated successfully');
    return puzzle;
  } catch (e) {
    console.error('[Connections] Generation failed:', e.message);
    return null;
  }
}

// Generate Deduction puzzle
async function generateDeductionPuzzle() {
  console.log('[Deduction] Generating puzzle...');

  const prompt = `Create a Quran-themed "Deduction" puzzle. Players see several verses and must deduce which surah they all belong to.

Rules:
1. Select ONE target surah
2. Provide 4-5 verses from that surah (different ayahs)
3. Include some verses that are distinctive to that surah
4. Make it challenging but solvable

Respond with ONLY this JSON format:
{
  "title": "Puzzle title",
  "intro": "Intro text for the player",
  "verses": [
    {"arabic": "...", "english": "...", "ref": "surah:ayah"}
  ],
  "categories": [
    {"num": 1, "name": "Surah Name", "name_ar": "...", "name_en": "..."},
    {"num": 2, "name": "...", "name_ar": "...", "name_en": "..."},
    {"num": 3, "name": "...", "name_ar": "...", "name_en": "..."},
    {"num": 4, "name": "...", "name_ar": "...", "name_en": "..."}
  ],
  "verseRef": "surah:ayah of one key verse",
  "arabic": "full arabic of key verse",
  "verse": "english of key verse"
}`;

  try {
    const content = await callMIMO(prompt);
    const cleaned = content.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const puzzle = JSON.parse(cleaned);
    console.log('[Deduction] Generated successfully');
    return puzzle;
  } catch (e) {
    console.error('[Deduction] Generation failed:', e.message);
    return null;
  }
}

// Generate Harf puzzle
async function generateHarfPuzzle() {
  console.log('[Harf] Generating puzzle...');

  const prompt = `Create a Quran-themed "Harf" (Word) puzzle. Players guess a target Arabic word based on clues.

Rules:
1. Select ONE target Arabic word from the Quran (a noun, verb, or significant word)
2. Create 3-4 clues that hint at the word without being too obvious
3. Include the verse where the word appears

Respond with ONLY this JSON format:
{
  "word": "target Arabic word",
  "display": "word with some letters hidden (e.g., "_ _ _ _ _")",
  "hint": "English hint about the word",
  "verseRef": "surah:ayah",
  "arabicVerse": "full arabic verse",
  "verse": "english translation"
}`;

  try {
    const content = await callMIMO(prompt);
    const cleaned = content.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const puzzle = JSON.parse(cleaned);
    console.log('[Harf] Generated successfully');
    return puzzle;
  } catch (e) {
    console.error('[Harf] Generation failed:', e.message);
    return null;
  }
}

// Generate Scramble puzzle
async function generateScramblePuzzle() {
  console.log('[Scramble] Generating puzzle...');

  const prompt = `Create a Quran-themed "Scramble" puzzle. Players unscramble Arabic word segments to form a complete verse.

Rules:
1. Select ONE verse from the Quran (not too long, not too short)
2. Break it into 4-5 segments (words or short phrases)
3. Scramble the order of segments

Respond with ONLY this JSON format:
{
  "verseRef": "surah:ayah",
  "reference": "Surah Name ayah",
  "segments": ["segment1", "segment2", "segment3", "segment4"],
  "translations": ["trans1", "trans2", "trans3", "trans4"],
  "hint": "Hint about the verse topic",
  "arabic": "full correct arabic verse",
  "words": ["word1", "word2", "word3", "word4"],
  "verseEn": "full english translation"
}`;

  try {
    const content = await callMIMO(prompt);
    const cleaned = content.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const puzzle = JSON.parse(cleaned);
    console.log('[Scramble] Generated successfully');
    return puzzle;
  } catch (e) {
    console.error('[Scramble] Generation failed:', e.message);
    return null;
  }
}

// Save puzzle to file
function savePuzzle(filename, puzzle) {
  const today = getToday();
  const data = {
    date: today,
    puzzle: puzzle,
    generated: true,
    model: 'mimo-v2-flash'
  };

  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Save] ${filename} saved`);
}

// Save to history
function saveToHistory(puzzles) {
  const today = getToday();
  const historyData = {
    date: today,
    puzzle: puzzles.connections,
    deduction: puzzles.deduction,
    harf: puzzles.harf,
    scramble: puzzles.scramble
  };

  const filepath = path.join(DATA_DIR, 'history', `${today}.json`);
  fs.writeFileSync(filepath, JSON.stringify(historyData, null, 2), 'utf8');
  console.log(`[Save] History saved for ${today}`);
}

// Main function
async function main() {
  console.log('=== Daily Puzzle Generator ===');
  console.log(`Date: ${getToday()}`);
  console.log('');

  if (!MIMO_API_KEY) {
    console.error('ERROR: MIMO_API_KEY not set');
    process.exit(1);
  }

  const puzzles = {};

  // Generate each puzzle type
  puzzles.connections = await generateConnectionsPuzzle();
  await sleep(2000);

  puzzles.deduction = await generateDeductionPuzzle();
  await sleep(2000);

  puzzles.harf = await generateHarfPuzzle();
  await sleep(2000);

  puzzles.scramble = await generateScramblePuzzle();

  // Save puzzles
  if (puzzles.connections) savePuzzle('daily_puzzle.json', puzzles.connections);
  if (puzzles.deduction) savePuzzle('daily_deduction.json', puzzles.deduction);
  if (puzzles.harf) savePuzzle('daily_harf.json', puzzles.harf);
  if (puzzles.scramble) savePuzzle('daily_scramble.json', puzzles.scramble);

  // Save to history
  saveToHistory(puzzles);

  console.log('');
  console.log('=== Generation Complete ===');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
