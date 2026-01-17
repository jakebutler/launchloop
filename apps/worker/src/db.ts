import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { config } from './config'

let db: Database.Database | null = null

export const getDb = (): Database.Database => {
  if (!db) {
    const dir = path.dirname(config.sqliteDbPath)
    fs.mkdirSync(dir, { recursive: true })
    db = new Database(config.sqliteDbPath)
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        project_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT,
        output TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brief TEXT NOT NULL,
        funnel_archetype TEXT NOT NULL,
        repo_owner TEXT,
        repo_name TEXT,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        demo_mode INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_events (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        ts TEXT NOT NULL,
        level TEXT NOT NULL,
        actor TEXT NOT NULL,
        message TEXT NOT NULL,
        meta TEXT,
        correlation_id TEXT,
        job_id TEXT
      );

      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        variants TEXT NOT NULL,
        start_at TEXT NOT NULL,
        end_at TEXT,
        winner TEXT
      );
    `)

    const jobColumns = db.prepare('PRAGMA table_info(jobs)').all() as { name: string }[]
    const jobNames = new Set(jobColumns.map((col) => col.name))
    if (!jobNames.has('summary')) {
      db.exec('ALTER TABLE jobs ADD COLUMN summary TEXT')
    }
    if (!jobNames.has('output')) {
      db.exec('ALTER TABLE jobs ADD COLUMN output TEXT')
    }

    const projectColumns = db.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
    const projectNames = new Set(projectColumns.map((col) => col.name))
    if (!projectNames.has('repo_owner')) {
      db.exec('ALTER TABLE projects ADD COLUMN repo_owner TEXT')
    }
    if (!projectNames.has('repo_name')) {
      db.exec('ALTER TABLE projects ADD COLUMN repo_name TEXT')
    }

    const experimentColumns = db.prepare('PRAGMA table_info(experiments)').all() as { name: string }[]
    const experimentNames = new Set(experimentColumns.map((col) => col.name))
    if (!experimentNames.has('start_at')) {
      db.exec('ALTER TABLE experiments ADD COLUMN start_at TEXT')
    }
  }
  return db
}
