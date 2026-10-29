const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const migrationsRoot = resolve(__dirname, '../prisma/migrations');
const baseline = readFileSync(
  resolve(migrationsRoot, '20261028000100_baseline_v3/migration.sql'),
  'utf8'
);
const workspaceMigration = readFileSync(
  resolve(migrationsRoot, '20261028000200_workspace_foundations/migration.sql'),
  'utf8'
);

test('baseline migration establishes the complete pre-C03 schema', () => {
  assert.match(baseline, /CREATE TABLE "users"/);
  assert.match(baseline, /CREATE TABLE "projects"/);
  assert.match(baseline, /CREATE TABLE "tasks"/);
  assert.doesNotMatch(baseline, /CREATE TABLE "workspaces"/);
});

test('workspace migration creates constrained workspace and membership tables', () => {
  assert.match(workspaceMigration, /CREATE TABLE "workspaces"/);
  assert.match(workspaceMigration, /CREATE TABLE "workspace_members"/);
  assert.match(workspaceMigration, /workspaces_link_matches_type_check/);
  assert.match(workspaceMigration, /workspace_members_single_owner_unique/);
  assert.match(workspaceMigration, /workspace_members_accepted_has_joined_at_check/);
});

test('workspace migration backfills legacy ownership without rewriting task provenance', () => {
  assert.match(workspaceMigration, /'PERSONAL'/);
  assert.match(workspaceMigration, /'SUBJECT'/);
  assert.match(workspaceMigration, /'PROJECT'/);
  assert.match(
    workspaceMigration,
    /WHEN "member"\."role" IN \('OWNER', 'ADMIN'\) THEN 'MANAGER'/
  );
  assert.doesNotMatch(workspaceMigration, /UPDATE\s+"tasks"/i);
  assert.doesNotMatch(workspaceMigration, /DROP\s+(TABLE|COLUMN)/i);
});
