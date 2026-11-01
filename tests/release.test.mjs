// Release hygiene: the plugin manifests (Claude Code, Codex and Cursor), the README badge and the changelog agree on the version,
// so a release never ships half-bumped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO, SKILL, readJson } from './helpers.mjs';

const plugin = readJson(path.join(REPO, '.claude-plugin', 'plugin.json'));
const marketplace = readJson(path.join(REPO, '.claude-plugin', 'marketplace.json'));
const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');

test('the plugin version is a semantic version', () => {
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
});

test('the marketplace lists this plugin, from this repo', () => {
  const entry = marketplace.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, `marketplace.json lists ${plugin.name}`);
  assert.equal(entry.source, './');
});

test('the Codex plugin matches the Claude Code plugin and points at the same skill', () => {
  const codex = readJson(path.join(REPO, '.codex-plugin', 'plugin.json'));
  assert.equal(codex.name, plugin.name);
  assert.equal(codex.version, plugin.version, '.codex-plugin/plugin.json version');
  assert.equal(codex.skills, './skills/');
  assert.ok(fs.existsSync(path.join(REPO, 'skills', plugin.name, 'SKILL.md')));
  for (const k of ['composerIcon', 'logo']) assert.ok(fs.existsSync(path.join(REPO, codex.interface[k])), `${k}: ${codex.interface[k]}`);
});

test('the Codex marketplace lists this plugin, from this repo', () => {
  const codexMarket = readJson(path.join(REPO, '.agents', 'plugins', 'marketplace.json'));
  const entry = codexMarket.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, `.agents/plugins/marketplace.json lists ${plugin.name}`);
  assert.deepEqual(entry.source, { source: 'local', path: './' });
});

test('the Cursor plugin matches the Claude Code plugin and points at the same skill', () => {
  const cursor = readJson(path.join(REPO, '.cursor-plugin', 'plugin.json'));
  assert.equal(cursor.name, plugin.name);
  assert.equal(cursor.version, plugin.version, '.cursor-plugin/plugin.json version');
  assert.equal(cursor.description, plugin.description);
  assert.equal(cursor.license, plugin.license);
  assert.deepEqual(cursor.keywords, plugin.keywords);
  assert.equal(cursor.skills, './skills/');
  assert.ok(fs.existsSync(path.join(REPO, 'skills', plugin.name, 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(REPO, cursor.logo)), `logo: ${cursor.logo}`);
});

test('the Cursor marketplace lists this plugin, from this repo', () => {
  const cursorMarket = readJson(path.join(REPO, '.cursor-plugin', 'marketplace.json'));
  assert.ok(cursorMarket.owner?.name, '.cursor-plugin/marketplace.json owner.name');
  const entry = cursorMarket.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, `.cursor-plugin/marketplace.json lists ${plugin.name}`);
  assert.equal(entry.source, './');
});

// A small JSON Schema (draft-07) checker covering what Cursor's marketplace schema uses,
// so the test stays dependency-free. Schema copied from github.com/cursor/plugins/schemas.
function schemaErrors(schema, value, root = schema, at = '$') {
  if (schema.$ref) return schemaErrors(schema.$ref.replace('#/', '').split('/').reduce((o, k) => o[k], root), value, root, at);
  if (schema.oneOf) {
    const ok = schema.oneOf.filter((s) => schemaErrors(s, value, root, at).length === 0).length;
    return ok === 1 ? [] : [`${at}: matches ${ok} of oneOf`];
  }
  if ('const' in schema) return value === schema.const ? [] : [`${at}: must be ${JSON.stringify(schema.const)}`];
  const errors = [];
  const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (schema.type && schema.type !== type) return [`${at}: expected ${schema.type}, got ${type}`];
  if (type === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${at}: too short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: does not match ${schema.pattern}`);
  }
  if (type === 'array' && schema.items) value.forEach((v, i) => errors.push(...schemaErrors(schema.items, v, root, `${at}[${i}]`)));
  if (type === 'object') {
    const props = schema.properties || {};
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${at}: missing ${key}`);
    if (schema.minProperties != null && Object.keys(value).length < schema.minProperties) errors.push(`${at}: too few properties`);
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) errors.push(...schemaErrors(props[key], v, root, `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}: ${key} is not allowed`);
      else if (typeof schema.additionalProperties === 'object') errors.push(...schemaErrors(schema.additionalProperties, v, root, `${at}.${key}`));
    }
  }
  return errors;
}

test('the Cursor marketplace passes Cursor\'s official marketplace schema', () => {
  const schema = readJson(path.join(REPO, 'tests', 'fixtures', 'cursor-marketplace.schema.json'));
  const market = readJson(path.join(REPO, '.cursor-plugin', 'marketplace.json'));
  assert.deepEqual(schemaErrors(schema, market), []);
  // The checker itself must catch the field that slipped through before.
  const bad = structuredClone(market);
  bad.plugins[0].category = 'developer-tools';
  assert.ok(schemaErrors(schema, bad).some((e) => e.includes('category is not allowed')));
});

test('the README version badge matches plugin.json', () => {
  assert.match(read('README.md'), new RegExp(`badge/version-${plugin.version.replaceAll('.', '\\.')}-`));
});

test('the changelog has an entry for this version', () => {
  assert.match(read('CHANGELOG.md'), new RegExp(`^## ${plugin.version.replaceAll('.', '\\.')} \\(\\d{4}-\\d{2}-\\d{2}\\)$`, 'm'));
});

test('the skill has a name and description, and every file it points to exists', () => {
  const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
  assert.match(skill, /^---\nname: floorplan\ndescription: .{50,}/);
  for (const [, ref] of skill.matchAll(/\]\((references\/[\w.-]+\.md)/g)) assert.ok(fs.existsSync(path.join(SKILL, ref)), ref);
  for (const [, script] of skill.matchAll(/scripts\/(\w+\.mjs)/g)) assert.ok(fs.existsSync(path.join(SKILL, 'scripts', script)), script);
});

test('CHECKSUMS.txt is for this version, so each release ships its fingerprints', () => {
  assert.match(read('CHECKSUMS.txt'), new RegExp(`^# Floorplan ${plugin.version.replaceAll('.', '\\.')}:`), 'run node tools/checksums.mjs when bumping the version');
});
