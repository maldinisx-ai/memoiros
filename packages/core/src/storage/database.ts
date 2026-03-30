/**
 * MemoirOS Storage Layer
 *
 * SQLite-based persistent storage for interviews, timelines, and voice profiles
 * Includes Zod validation for all data operations
 */

import Database from "better-sqlite3";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import {
  interviewSaveSchema,
  questionSaveSchema,
  answerSaveSchema,
  timelineEventSaveSchema,
  voiceProfileSaveSchema,
  type InterviewSave,
  type QuestionSave,
  type AnswerSave,
  type TimelineEventSave,
  type VoiceProfileSave,
} from "../schemas/database.schemas.js";
import {
  memcubeItemSaveSchema,
  memcubeCollectionSaveSchema,
  type MemCubeItemSave,
  type MemCubeCollectionSave,
} from "../schemas/memcube.schemas.js";
import {
  memoirSaveSchema,
  chapterSaveSchema,
  chapterContentSaveSchema,
  chapterVersionSaveSchema,
  type MemoirSave,
  type ChapterSave,
  type ChapterContentSave,
  type ChapterVersionSave,
} from "../schemas/chapter.schemas.js";

/**
 * Database configuration
 */
export interface DatabaseConfig {
  readonly dataDir?: string;  // Default: ./data
  readonly filename?: string; // Default: memoiros.db
}

/**
 * Storage class for managing all database operations
 */
export class MemoirOSStorage {
  private readonly db: Database.Database;
  private readonly dbPath: string;

  constructor(config: DatabaseConfig = {}) {
    const dataDir = config.dataDir ?? join(process.cwd(), "data");
    const filename = config.filename ?? "memoiros.db";
    this.dbPath = join(dataDir, filename);

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdir(dataDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Interviews table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interviews (
        interview_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        current_phase TEXT NOT NULL CHECK(current_phase IN (
          'warmup', 'childhood', 'education', 'career', 'family',
          'milestones', 'reflections', 'closing'
        )),
        metadata TEXT NOT NULL,  -- JSON
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Interview questions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interview_questions (
        question_id TEXT PRIMARY KEY,
        interview_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        question TEXT NOT NULL,
        question_type TEXT NOT NULL CHECK(question_type IN ('open', 'specific', 'followup', 'clarification')),
        target_entities TEXT,  -- JSON array
        priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
        asked_at TEXT,
        answered INTEGER DEFAULT 0,
        FOREIGN KEY (interview_id) REFERENCES interviews(interview_id) ON DELETE CASCADE
      )
    `);

    // Interview answers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interview_answers (
        answer_id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        interview_id TEXT NOT NULL,
        answer TEXT NOT NULL,
        answered_at TEXT NOT NULL,
        extracted_entities TEXT,  -- JSON
        sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
        needs_followup INTEGER DEFAULT 0,
        followup_topics TEXT,  -- JSON array
        FOREIGN KEY (interview_id) REFERENCES interviews(interview_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES interview_questions(question_id) ON DELETE CASCADE
      )
    `);

    // Timeline events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        event_id TEXT PRIMARY KEY,
        timeline_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        date_type TEXT NOT NULL CHECK(date_type IN ('exact', 'era', 'approximate')),
        date_year INTEGER,
        date_month INTEGER,
        date_day INTEGER,
        date_era TEXT,
        date_range INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN (
          'birth', 'education', 'career', 'family', 'residence',
          'travel', 'health', 'achievement', 'milestone', 'historical_context'
        )),
        importance TEXT NOT NULL CHECK(importance IN ('critical', 'high', 'medium', 'low')),
        verified INTEGER DEFAULT 0,
        confidence REAL NOT NULL,
        tags TEXT,  -- JSON array
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Voice profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS voice_profiles (
        profile_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        characteristics TEXT NOT NULL,  -- JSON
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        confidence REAL NOT NULL
      )
    `);

    // Voice samples table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS voice_samples (
        sample_id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK(source_type IN ('interview_answer', 'written_sample', 'voice_transcript')),
        content TEXT NOT NULL,
        weight REAL NOT NULL,
        metadata TEXT,  -- JSON
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (profile_id) REFERENCES voice_profiles(profile_id) ON DELETE CASCADE
      )
    `);

    // MemCube items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memcube_items (
        cube_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_id TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        item_type TEXT NOT NULL CHECK(item_type IN (
          'interview_answer', 'timeline_event', 'chapter_draft',
          'voice_sample', 'fact', 'reflection'
        )),
        source_id TEXT,
        embedding_id TEXT UNIQUE,
        embedding_model TEXT,
        status TEXT NOT NULL CHECK(status IN (
          'draft', 'processing', 'indexed', 'archived', 'deleted'
        )) DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        indexed_at TEXT,
        keywords TEXT,  -- JSON array
        semantic_tags TEXT,  -- JSON array
        related_cube_ids TEXT,  -- JSON array
        parent_cube_id TEXT,
        access_count INTEGER DEFAULT 0,
        last_accessed_at TEXT,
        FOREIGN KEY (parent_cube_id) REFERENCES memcube_items(cube_id) ON DELETE SET NULL
      )
    `);

    // MemCube collections table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memcube_collections (
        collection_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        cube_ids TEXT NOT NULL,  -- JSON array
        parent_collection_id TEXT,
        metadata TEXT,  -- JSON object
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_collection_id) REFERENCES memcube_collections(collection_id) ON DELETE CASCADE
      )
    `);

    // FTS5 virtual table for MemCube full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memcube_fts USING fts5(
        cube_id,
        user_id,
        content,
        keywords,
        item_type,
        status,
        tokenize = 'porter unicode61'
      )
    `);

    // FTS5 virtual table for interview answers full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS interview_answers_fts USING fts5(
        answer_id,
        interview_id,
        answer,
        extracted_entities,
        tokenize = 'porter unicode61'
      )
    `);

    // Memoirs table (for organizing chapters)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memoirs (
        memoir_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK(status IN ('draft', 'in_progress', 'completed')) DEFAULT 'draft',
        metadata TEXT,  -- JSON object
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Chapters table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        chapter_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        memoir_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
        type TEXT NOT NULL CHECK(type IN (
          'prologue', 'childhood', 'education', 'career', 'family',
          'travel', 'reflections', 'epilogue', 'other'
        )) DEFAULT 'other',
        order_idx INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT,
        metadata TEXT,  -- JSON object
        FOREIGN KEY (memoir_id) REFERENCES memoirs(memoir_id) ON DELETE CASCADE
      )
    `);

    // Chapter contents table (for storing actual chapter content)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapter_contents (
        content_id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        markdown TEXT,
        word_count INTEGER NOT NULL DEFAULT 0,
        character_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
      )
    `);

    // Chapter versions table (for version history)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapter_versions (
        version_id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        markdown TEXT,
        change_type TEXT NOT NULL CHECK(change_type IN ('create', 'update', 'minor', 'revert')),
        change_description TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE,
        UNIQUE(chapter_id, version_number)
      )
    `);

    // FTS5 virtual table for chapters full-text search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
        chapter_id,
        user_id,
        memoir_id,
        title,
        content,
        type,
        status,
        tokenize = 'porter unicode61'
      )
    `);

    // User accounts table (for authentication)
    // Note: bcrypt hash includes embedded salt, no separate salt column needed
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'suspended', 'deleted')) DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT,
        metadata TEXT  -- JSON object
      )
    `);

    // User sessions table (for session management)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,  -- JSON object
        FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
      )
    `);

    // Password reset tokens table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
      CREATE INDEX IF NOT EXISTS idx_questions_interview_id ON interview_questions(interview_id);
      CREATE INDEX IF NOT EXISTS idx_answers_interview_id ON interview_answers(interview_id);
      CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_timeline_events_timeline_id ON timeline_events(timeline_id);
      CREATE INDEX IF NOT EXISTS idx_memcube_items_user_id ON memcube_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_memcube_items_status ON memcube_items(status);
      CREATE INDEX IF NOT EXISTS idx_memcube_items_item_type ON memcube_items(item_type);
      CREATE INDEX IF NOT EXISTS idx_memcube_items_content_hash ON memcube_items(content_hash);
      CREATE INDEX IF NOT EXISTS idx_memcube_items_embedding_id ON memcube_items(embedding_id);
      CREATE INDEX IF NOT EXISTS idx_memcube_collections_user_id ON memcube_collections(user_id);
      CREATE INDEX IF NOT EXISTS idx_memoirs_user_id ON memoirs(user_id);
      CREATE INDEX IF NOT EXISTS idx_memoirs_status ON memoirs(status);
      CREATE INDEX IF NOT EXISTS idx_chapters_user_id ON chapters(user_id);
      CREATE INDEX IF NOT EXISTS idx_chapters_memoir_id ON chapters(memoir_id);
      CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
      CREATE INDEX IF NOT EXISTS idx_chapters_type ON chapters(type);
      CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(order_idx);
      CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_phone ON user_accounts(phone);
      CREATE INDEX IF NOT EXISTS idx_user_accounts_status ON user_accounts(status);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `);

    // Create triggers for FTS5 synchronization
    this.db.exec(`
      -- Trigger for memcube_items -> memcube_fts
      CREATE TRIGGER IF NOT EXISTS memcube_fts_insert AFTER INSERT ON memcube_items BEGIN
        INSERT INTO memcube_fts(cube_id, user_id, content, keywords, item_type, status)
        VALUES (NEW.cube_id, NEW.user_id, NEW.content, NEW.keywords, NEW.item_type, NEW.status);
      END;

      CREATE TRIGGER IF NOT EXISTS memcube_fts_delete AFTER DELETE ON memcube_items BEGIN
        DELETE FROM memcube_fts WHERE cube_id = OLD.cube_id;
      END;

      CREATE TRIGGER IF NOT EXISTS memcube_fts_update AFTER UPDATE ON memcube_items BEGIN
        UPDATE memcube_fts
        SET content = NEW.content,
            keywords = NEW.keywords,
            item_type = NEW.item_type,
            status = NEW.status
        WHERE cube_id = NEW.cube_id;
      END;

      -- Trigger for interview_answers -> interview_answers_fts
      CREATE TRIGGER IF NOT EXISTS interview_answers_fts_insert AFTER INSERT ON interview_answers BEGIN
        INSERT INTO interview_answers_fts(answer_id, interview_id, answer, extracted_entities)
        VALUES (NEW.answer_id, NEW.interview_id, NEW.answer, NEW.extracted_entities);
      END;

      CREATE TRIGGER IF NOT EXISTS interview_answers_fts_delete AFTER DELETE ON interview_answers BEGIN
        DELETE FROM interview_answers_fts WHERE answer_id = OLD.answer_id;
      END;

      CREATE TRIGGER IF NOT EXISTS interview_answers_fts_update AFTER UPDATE ON interview_answers BEGIN
        UPDATE interview_answers_fts
        SET answer = NEW.answer,
            extracted_entities = NEW.extracted_entities
        WHERE answer_id = NEW.answer_id;
      END;

      -- Trigger for chapters -> chapters_fts
      CREATE TRIGGER IF NOT EXISTS chapters_fts_insert AFTER INSERT ON chapters BEGIN
        INSERT INTO chapters_fts(chapter_id, user_id, memoir_id, title, content, type, status)
        VALUES (
          NEW.chapter_id,
          NEW.user_id,
          NEW.memoir_id,
          NEW.title,
          (SELECT content FROM chapter_contents WHERE chapter_id = NEW.chapter_id),
          NEW.type,
          NEW.status
        );
      END;

      CREATE TRIGGER IF NOT EXISTS chapters_fts_delete AFTER DELETE ON chapters BEGIN
        DELETE FROM chapters_fts WHERE chapter_id = OLD.chapter_id;
      END;

      CREATE TRIGGER IF NOT EXISTS chapters_fts_update AFTER UPDATE ON chapters BEGIN
        UPDATE chapters_fts
        SET title = NEW.title,
            type = NEW.type,
            status = NEW.status
        WHERE chapter_id = NEW.chapter_id;
      END;

      CREATE TRIGGER IF NOT EXISTS chapters_fts_content_update AFTER UPDATE ON chapter_contents BEGIN
        UPDATE chapters_fts
        SET content = NEW.content
        WHERE chapter_id = NEW.chapter_id;
      END;
    `);
  }

  /**
   * Save interview state with Zod validation
   */
  saveInterview(interview: InterviewSave): void {
    // Validate input using Zod schema
    const validated = interviewSaveSchema.parse(interview);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO interviews
      (interview_id, user_id, status, started_at, completed_at, current_phase, metadata, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      validated.interviewId,
      validated.userId,
      validated.status,
      validated.startedAt,
      validated.completedAt ?? null,
      validated.currentPhase,
      JSON.stringify(validated.metadata)
    );
  }

  /**
   * Load interview state
   */
  loadInterview(interviewId: string): {
    readonly interviewId: string;
    readonly userId: string;
    readonly status: "active" | "paused" | "completed";
    readonly startedAt: string;
    readonly completedAt?: string;
    readonly currentPhase: string;
    readonly metadata: Record<string, unknown>;
  } | null {
    const stmt = this.db.prepare(`
      SELECT interview_id, user_id, status, started_at, completed_at, current_phase, metadata
      FROM interviews
      WHERE interview_id = ?
    `);

    const row = stmt.get(interviewId) as {
      interview_id: string;
      user_id: string;
      status: "active" | "paused" | "completed";
      started_at: string;
      completed_at: string | null;
      current_phase: string;
      metadata: string;
    } | undefined;

    if (!row) return null;

    return {
      interviewId: row.interview_id,
      userId: row.user_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      currentPhase: row.current_phase,
      metadata: JSON.parse(row.metadata),
    };
  }

  /**
   * Save interview question with Zod validation
   */
  saveQuestion(question: QuestionSave): void {
    const validated = questionSaveSchema.parse(question);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO interview_questions
      (question_id, interview_id, phase, question, question_type, target_entities, priority, asked_at, answered)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.questionId,
      validated.interviewId,
      validated.phase,
      validated.question,
      validated.questionType,
      validated.targetEntities ? JSON.stringify(validated.targetEntities) : null,
      validated.priority,
      validated.askedAt ?? null,
      validated.answered ? 1 : 0
    );
  }

  /**
   * Save interview answer with Zod validation
   */
  saveAnswer(answer: AnswerSave): void {
    const validated = answerSaveSchema.parse(answer);

    const stmt = this.db.prepare(`
      INSERT INTO interview_answers
      (answer_id, question_id, interview_id, answer, answered_at, extracted_entities, sentiment, needs_followup, followup_topics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.answerId,
      validated.questionId,
      validated.interviewId,
      validated.answer,
      validated.answeredAt,
      validated.extractedEntities ? JSON.stringify(validated.extractedEntities) : null,
      validated.sentiment ?? null,
      validated.needsFollowup ? 1 : 0,
      validated.followupTopics ? JSON.stringify(validated.followupTopics) : null
    );
  }

  /**
   * Load all answers for an interview
   */
  loadAnswers(interviewId: string): ReadonlyArray<{
    readonly answerId: string;
    readonly questionId: string;
    readonly answer: string;
    readonly answeredAt: string;
    readonly extractedEntities?: Record<string, unknown>;
  }> {
    const stmt = this.db.prepare(`
      SELECT answer_id, question_id, answer, answered_at, extracted_entities
      FROM interview_answers
      WHERE interview_id = ?
      ORDER BY answered_at ASC
    `);

    const rows = stmt.all(interviewId) as ReadonlyArray<{
      answer_id: string;
      question_id: string;
      answer: string;
      answered_at: string;
      extracted_entities: string | null;
    }>;

    return rows.map(row => ({
      answerId: row.answer_id,
      questionId: row.question_id,
      answer: row.answer,
      answeredAt: row.answered_at,
      extractedEntities: row.extracted_entities ? JSON.parse(row.extracted_entities) : undefined,
    }));
  }

  /**
   * Save timeline event with Zod validation
   */
  saveTimelineEvent(event: TimelineEventSave): void {
    const validated = timelineEventSaveSchema.parse(event);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO timeline_events
      (event_id, timeline_id, user_id, date_type, date_year, date_month, date_day, date_era, date_range,
       title, description, category, importance, confidence, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      validated.eventId,
      validated.timelineId,
      validated.userId,
      validated.date.type,
      validated.date.year ?? null,
      validated.date.month ?? null,
      validated.date.day ?? null,
      validated.date.era ?? null,
      validated.date.range ?? null,
      validated.title,
      validated.description,
      validated.category,
      validated.importance,
      validated.confidence,
      validated.tags ? JSON.stringify(validated.tags) : null
    );
  }

  /**
   * Load timeline events for a user
   */
  loadTimelineEvents(userId: string): ReadonlyArray<{
    readonly eventId: string;
    readonly timelineId: string;
    readonly date: {
      readonly type: "exact" | "era" | "approximate";
      readonly year?: number;
      readonly month?: number;
      readonly day?: number;
      readonly era?: string;
      readonly range?: number;
    };
    readonly title: string;
    readonly description: string;
    readonly category: string;
    readonly importance: "critical" | "high" | "medium" | "low";
    readonly confidence: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT event_id, timeline_id, date_type, date_year, date_month, date_day, date_era, date_range,
             title, description, category, importance, confidence
      FROM timeline_events
      WHERE user_id = ?
      ORDER BY
        CASE date_type
          WHEN 'exact' THEN 1
          WHEN 'approximate' THEN 2
          ELSE 3
        END,
        date_year ASC,
        date_month ASC,
        date_day ASC
    `);

    const rows = stmt.all(userId) as ReadonlyArray<{
      event_id: string;
      timeline_id: string;
      date_type: "exact" | "era" | "approximate";
      date_year: number | null;
      date_month: number | null;
      date_day: number | null;
      date_era: string | null;
      date_range: number | null;
      title: string;
      description: string;
      category: string;
      importance: "critical" | "high" | "medium" | "low";
      confidence: number;
    }>;

    return rows.map(row => ({
      eventId: row.event_id,
      timelineId: row.timeline_id,
      date: {
        type: row.date_type,
        year: row.date_year ?? undefined,
        month: row.date_month ?? undefined,
        day: row.date_day ?? undefined,
        era: row.date_era ?? undefined,
        range: row.date_range ?? undefined,
      },
      title: row.title,
      description: row.description,
      category: row.category,
      importance: row.importance,
      confidence: row.confidence,
    }));
  }

  /**
   * Save voice profile with Zod validation
   */
  saveVoiceProfile(profile: VoiceProfileSave): void {
    const validated = voiceProfileSaveSchema.parse(profile);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO voice_profiles
      (profile_id, user_id, characteristics, updated_at, confidence)
      VALUES (?, ?, ?, datetime('now'), ?)
    `);

    stmt.run(
      validated.profileId,
      validated.userId,
      JSON.stringify(validated.characteristics),
      validated.confidence
    );
  }

  /**
   * Load voice profile for a user
   */
  loadVoiceProfile(userId: string): {
    readonly profileId: string;
    readonly userId: string;
    readonly characteristics: Record<string, unknown>;
    readonly confidence: number;
  } | null {
    const stmt = this.db.prepare(`
      SELECT profile_id, user_id, characteristics, confidence
      FROM voice_profiles
      WHERE user_id = ?
    `);

    const row = stmt.get(userId) as {
      profile_id: string;
      user_id: string;
      characteristics: string;
      confidence: number;
    } | undefined;

    if (!row) return null;

    return {
      profileId: row.profile_id,
      userId: row.user_id,
      characteristics: JSON.parse(row.characteristics),
      confidence: row.confidence,
    };
  }

  /**
   * Save MemCube item with Zod validation
   */
  saveMemCubeItem(item: MemCubeItemSave): void {
    const validated = memcubeItemSaveSchema.parse(item);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memcube_items
      (cube_id, user_id, item_id, content, content_hash, item_type, source_id,
       embedding_id, embedding_model, status, created_at, updated_at, indexed_at,
       keywords, semantic_tags, related_cube_ids, parent_cube_id, access_count, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.cubeId,
      validated.userId,
      validated.itemId,
      validated.content,
      validated.contentHash,
      validated.itemType,
      validated.sourceId ?? null,
      validated.embeddingId ?? null,
      validated.embeddingModel ?? null,
      validated.status,
      validated.createdAt,
      validated.updatedAt,
      validated.indexedAt ?? null,
      JSON.stringify(validated.keywords),
      JSON.stringify(validated.semanticTags),
      JSON.stringify(validated.relatedCubeIds),
      validated.parentCubeId ?? null,
      validated.accessCount,
      validated.lastAccessedAt ?? null
    );
  }

  /**
   * Load MemCube item by ID
   */
  loadMemCubeItem(cubeId: string): {
    readonly cubeId: string;
    readonly userId: string;
    readonly itemId: string;
    readonly content: string;
    readonly contentHash: string;
    readonly itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
    readonly sourceId?: string;
    readonly embeddingId?: string;
    readonly embeddingModel?: string;
    readonly status: "draft" | "processing" | "indexed" | "archived" | "deleted";
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly indexedAt?: string;
    readonly keywords: ReadonlyArray<string>;
    readonly semanticTags: ReadonlyArray<string>;
    readonly relatedCubeIds: ReadonlyArray<string>;
    readonly parentCubeId?: string;
    readonly accessCount: number;
    readonly lastAccessedAt?: string;
  } | null {
    const stmt = this.db.prepare(`
      SELECT cube_id, user_id, item_id, content, content_hash, item_type, source_id,
             embedding_id, embedding_model, status, created_at, updated_at, indexed_at,
             keywords, semantic_tags, related_cube_ids, parent_cube_id, access_count, last_accessed_at
      FROM memcube_items
      WHERE cube_id = ?
    `);

    const row = stmt.get(cubeId) as {
      cube_id: string;
      user_id: string;
      item_id: string;
      content: string;
      content_hash: string;
      item_type: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
      source_id: string | null;
      embedding_id: string | null;
      embedding_model: string | null;
      status: "draft" | "processing" | "indexed" | "archived" | "deleted";
      created_at: string;
      updated_at: string;
      indexed_at: string | null;
      keywords: string;
      semantic_tags: string;
      related_cube_ids: string;
      parent_cube_id: string | null;
      access_count: number;
      last_accessed_at: string | null;
    } | undefined;

    if (!row) return null;

    return {
      cubeId: row.cube_id,
      userId: row.user_id,
      itemId: row.item_id,
      content: row.content,
      contentHash: row.content_hash,
      itemType: row.item_type,
      sourceId: row.source_id ?? undefined,
      embeddingId: row.embedding_id ?? undefined,
      embeddingModel: row.embedding_model ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      indexedAt: row.indexed_at ?? undefined,
      keywords: JSON.parse(row.keywords),
      semanticTags: JSON.parse(row.semantic_tags),
      relatedCubeIds: JSON.parse(row.related_cube_ids),
      parentCubeId: row.parent_cube_id ?? undefined,
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at ?? undefined,
    };
  }

  /**
   * Update MemCube item embedding ID
   */
  updateMemCubeEmbedding(cubeId: string, embeddingId: string, embeddingModel: string): void {
    const stmt = this.db.prepare(`
      UPDATE memcube_items
      SET embedding_id = ?, embedding_model = ?, updated_at = datetime('now')
      WHERE cube_id = ?
    `);
    stmt.run(embeddingId, embeddingModel, cubeId);
  }

  /**
   * Update MemCube item status
   */
  updateMemCubeStatus(
    cubeId: string,
    status: "draft" | "processing" | "indexed" | "archived" | "deleted",
    indexedAt?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE memcube_items
      SET status = ?, indexed_at = COALESCE(?, indexed_at), updated_at = datetime('now')
      WHERE cube_id = ?
    `);
    stmt.run(status, indexedAt ?? null, cubeId);
  }

  /**
   * Increment access count for a MemCube item
   */
  incrementMemCubeAccess(cubeId: string): void {
    const stmt = this.db.prepare(`
      UPDATE memcube_items
      SET access_count = access_count + 1, last_accessed_at = datetime('now')
      WHERE cube_id = ?
    `);
    stmt.run(cubeId);
  }

  /**
   * Load all MemCube items for a user
   */
  loadMemCubeItems(userId: string, status?: "draft" | "processing" | "indexed" | "archived" | "deleted"): ReadonlyArray<{
    readonly cubeId: string;
    readonly userId: string;
    readonly itemId: string;
    readonly content: string;
    readonly itemType: string;
    readonly status: string;
    readonly embeddingId?: string;
    readonly sourceId?: string;
    readonly parentCubeId?: string;
    readonly accessCount: number;
    readonly lastAccessedAt?: string;
  }> {
    let query = `
      SELECT cube_id, user_id, item_id, content, item_type, status, embedding_id, source_id, parent_cube_id, access_count, last_accessed_at
      FROM memcube_items
      WHERE user_id = ?
    `;
    const params: unknown[] = [userId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as ReadonlyArray<{
      cube_id: string;
      user_id: string;
      item_id: string;
      content: string;
      item_type: string;
      status: string;
      embedding_id: string | null;
      source_id: string | null;
      parent_cube_id: string | null;
      access_count: number;
      last_accessed_at: string | null;
    }>;

    return rows.map(row => ({
      cubeId: row.cube_id,
      userId: row.user_id,
      itemId: row.item_id,
      content: row.content,
      itemType: row.item_type,
      status: row.status,
      embeddingId: row.embedding_id ?? undefined,
      sourceId: row.source_id ?? undefined,
      parentCubeId: row.parent_cube_id ?? undefined,
      accessCount: row.access_count,
      lastAccessedAt: row.last_accessed_at ?? undefined,
    }));
  }

  /**
   * Save MemCube collection with Zod validation
   */
  saveMemCubeCollection(collection: MemCubeCollectionSave): void {
    const validated = memcubeCollectionSaveSchema.parse(collection);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memcube_collections
      (collection_id, user_id, name, description, cube_ids, parent_collection_id, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.collectionId,
      validated.userId,
      validated.name,
      validated.description ?? null,
      JSON.stringify(validated.cubeIds),
      validated.parentCollectionId ?? null,
      JSON.stringify(validated.metadata),
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Load MemCube collection by ID
   */
  loadMemCubeCollection(collectionId: string): {
    readonly collectionId: string;
    readonly userId: string;
    readonly name: string;
    readonly description?: string;
    readonly cubeIds: ReadonlyArray<string>;
    readonly parentCollectionId?: string;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: string;
    readonly updatedAt: string;
  } | null {
    const stmt = this.db.prepare(`
      SELECT collection_id, user_id, name, description, cube_ids, parent_collection_id, metadata, created_at, updated_at
      FROM memcube_collections
      WHERE collection_id = ?
    `);

    const row = stmt.get(collectionId) as {
      collection_id: string;
      user_id: string;
      name: string;
      description: string | null;
      cube_ids: string;
      parent_collection_id: string | null;
      metadata: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
      collectionId: row.collection_id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      cubeIds: JSON.parse(row.cube_ids),
      parentCollectionId: row.parent_collection_id ?? undefined,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Load all MemCube collections for a user
   */
  loadMemCubeCollections(userId: string): ReadonlyArray<{
    readonly collectionId: string;
    readonly userId: string;
    readonly name: string;
    readonly description?: string;
    readonly cubeIds: ReadonlyArray<string>;
    readonly parentCollectionId?: string;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: string;
    readonly updatedAt: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT collection_id, user_id, name, description, cube_ids, parent_collection_id, metadata, created_at, updated_at
      FROM memcube_collections
      WHERE user_id = ?
      ORDER BY name ASC
    `);

    const rows = stmt.all(userId) as ReadonlyArray<{
      collection_id: string;
      user_id: string;
      name: string;
      description: string | null;
      cube_ids: string;
      parent_collection_id: string | null;
      metadata: string;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map(row => ({
      collectionId: row.collection_id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
      cubeIds: JSON.parse(row.cube_ids),
      parentCollectionId: row.parent_collection_id ?? undefined,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Full-text search on MemCube items using FTS5
   */
  searchMemCubeFTS(params: {
    userId: string;
    query: string;
    itemType?: "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "fact" | "reflection";
    status?: "draft" | "processing" | "indexed" | "archived" | "deleted";
    limit?: number;
    offset?: number;
  }): ReadonlyArray<{
    readonly cubeId: string;
    readonly userId: string;
    readonly itemId: string;
    readonly content: string;
    readonly itemType: string;
    readonly status: string;
    readonly rank: number;
    readonly bm25: number;
  }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    // Build FTS5 query with filters
    let ftsQuery = params.query;

    // Add item_type filter
    if (params.itemType) {
      ftsQuery += ` item_type:"${params.itemType}"`;
    }

    // Add status filter
    if (params.status) {
      ftsQuery += ` status:"${params.status}"`;
    }

    const stmt = this.db.prepare(`
      SELECT
        ft.cube_id,
        ft.user_id,
        ft.item_type,
        ft.status,
        mi.item_id,
        mi.content,
        bm25(memcube_fts) as bm25
      FROM memcube_fts ft
      INNER JOIN memcube_items mi ON ft.cube_id = mi.cube_id
      WHERE ft.user_id = ? AND memcube_fts MATCH ?
      ORDER BY bm25(memcube_fts)
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(params.userId, ftsQuery, limit, offset) as ReadonlyArray<{
      cube_id: string;
      user_id: string;
      item_type: string;
      status: string;
      item_id: string;
      content: string;
      bm25: number;
    }>;

    return rows.map((row, index) => ({
      cubeId: row.cube_id,
      userId: row.user_id,
      itemId: row.item_id,
      content: row.content,
      itemType: row.item_type,
      status: row.status,
      rank: index + 1,
      bm25: row.bm25,
    }));
  }

  /**
   * Full-text search on interview answers using FTS5
   */
  searchInterviewAnswersFTS(params: {
    userId: string;
    query: string;
    interviewId?: string;
    limit?: number;
    offset?: number;
  }): ReadonlyArray<{
    readonly answerId: string;
    readonly interviewId: string;
    readonly answer: string;
    readonly answeredAt: string;
    readonly rank: number;
    readonly bm25: number;
  }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    let whereClause = "i.user_id = ? AND fts MATCH ?";
    const queryParams: unknown[] = [params.userId, params.query];

    if (params.interviewId) {
      whereClause += " AND fts.interview_id = ?";
      queryParams.push(params.interviewId);
    }

    const stmt = this.db.prepare(`
      SELECT
        fts.answer_id,
        fts.interview_id,
        a.answer,
        a.answered_at,
        bm25(interview_answers_fts) as bm25
      FROM interview_answers_fts fts
      INNER JOIN interview_answers a ON fts.answer_id = a.answer_id
      INNER JOIN interviews i ON fts.interview_id = i.interview_id
      WHERE ${whereClause}
      ORDER BY bm25(interview_answers_fts)
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...queryParams, limit, offset) as ReadonlyArray<{
      answer_id: string;
      interview_id: string;
      answer: string;
      answered_at: string;
      bm25: number;
    }>;

    return rows.map((row, index) => ({
      answerId: row.answer_id,
      interviewId: row.interview_id,
      answer: row.answer,
      answeredAt: row.answered_at,
      rank: index + 1,
      bm25: row.bm25,
    }));
  }

  /**
   * Get search suggestions using FTS5 prefix search
   */
  getSearchSuggestions(params: {
    userId: string;
    prefix: string;
    table: "memcube" | "interview_answers";
    limit?: number;
  }): ReadonlyArray<string> {
    const limit = params.limit ?? 10;

    if (params.table === "memcube") {
      const stmt = this.db.prepare(`
        SELECT DISTINCT substr(content, 1, 100) as suggestion
        FROM memcube_fts
        WHERE user_id = ? AND content MATCH ?
        ORDER BY bm25(memcube_fts)
        LIMIT ?
      `);

      const rows = stmt.all(params.userId, `${params.prefix}*`, limit) as ReadonlyArray<{
        suggestion: string;
      }>;

      return rows.map(row => row.suggestion);
    } else {
      const stmt = this.db.prepare(`
        SELECT DISTINCT substr(answer, 1, 100) as suggestion
        FROM interview_answers_fts
        WHERE interview_id IN (
          SELECT interview_id FROM interviews WHERE user_id = ?
        ) AND answer MATCH ?
        ORDER BY bm25(interview_answers_fts)
        LIMIT ?
      `);

      const rows = stmt.all(params.userId, `${params.prefix}*`, limit) as ReadonlyArray<{
        suggestion: string;
      }>;

      return rows.map(row => row.suggestion);
    }
  }

  /**
   * Rebuild FTS5 index for MemCube items
   */
  rebuildMemCubeFTSIndex(): void {
    this.db.exec(`
      DELETE FROM memcube_fts;
      INSERT INTO memcube_fts(cube_id, user_id, content, keywords, item_type, status)
      SELECT cube_id, user_id, content, keywords, item_type, status FROM memcube_items;
    `);
  }

  /**
   * Rebuild FTS5 index for interview answers
   */
  rebuildInterviewAnswersFTSIndex(): void {
    this.db.exec(`
      DELETE FROM interview_answers_fts;
      INSERT INTO interview_answers_fts(answer_id, interview_id, answer, extracted_entities)
      SELECT answer_id, interview_id, answer, extracted_entities FROM interview_answers;
    `);
  }

  /**
   * Get FTS5 statistics
   */
  getFTS5Stats(): {
    memcubeCount: number;
    interviewAnswersCount: number;
    chaptersCount: number;
  } {
    const memcubeCount = this.db.prepare("SELECT COUNT(*) as count FROM memcube_fts").get() as {
      count: number;
    };
    const interviewAnswersCount = this.db.prepare("SELECT COUNT(*) as count FROM interview_answers_fts").get() as {
      count: number;
    };
    const chaptersCount = this.db.prepare("SELECT COUNT(*) as count FROM chapters_fts").get() as {
      count: number;
    };

    return {
      memcubeCount: memcubeCount.count,
      interviewAnswersCount: interviewAnswersCount.count,
      chaptersCount: chaptersCount.count,
    };
  }

  /**
   * Rebuild FTS5 index for chapters
   */
  rebuildChaptersFTSIndex(): void {
    this.db.exec(`
      DELETE FROM chapters_fts;
      INSERT INTO chapters_fts(chapter_id, user_id, memoir_id, title, content, type, status)
      SELECT c.chapter_id, c.user_id, c.memoir_id, c.title, cc.content, c.type, c.status
      FROM chapters c
      LEFT JOIN chapter_contents cc ON c.chapter_id = cc.chapter_id;
    `);
  }

  /**
   * Search chapters using FTS5
   */
  searchChaptersFTS(params: {
    userId: string;
    query: string;
    memoirId?: string;
    status?: string;
    limit: number;
  }): ReadonlyArray<{
    chapterId: string;
    userId: string;
    memoirId: string;
    title: string;
    content: string;
    type: string;
    status: string;
    bm25: number;
  }> {
    let sql = `
      SELECT c.chapter_id, c.user_id, c.memoir_id, c.title, cc.content, c.type, c.status, cfts.bm25
      FROM chapters_fts cfts
      JOIN chapters c ON cfts.chapter_id = c.chapter_id
      LEFT JOIN chapter_contents cc ON c.chapter_id = cc.chapter_id
      WHERE cfts.user_id = ? AND chapters_fts MATCH ?
    `;

    const queryParams: ReadonlyArray<string> = [params.userId, params.query];

    if (params.memoirId) {
      sql += " AND cfts.memoir_id = ?";
      (queryParams as string[]).push(params.memoirId);
    }

    if (params.status) {
      sql += " AND cfts.status = ?";
      (queryParams as string[]).push(params.status);
    }

    sql += " ORDER BY cfts.bm25 ASC LIMIT ?";
    (queryParams as string[]).push(String(params.limit));

    const stmt = this.db.prepare(sql);
    return stmt.all(...queryParams) as ReadonlyArray<{
      chapterId: string;
      userId: string;
      memoirId: string;
      title: string;
      content: string;
      type: string;
      status: string;
      bm25: number;
    }>;
  }

  /**
   * Get search suggestions for chapters using FTS5 prefix search
   */
  getChapterSearchSuggestions(
    userId: string,
    prefix: string,
    limit: number = 10
  ): ReadonlyArray<string> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT substr(title, 1, 50) as suggestion
      FROM chapters_fts
      WHERE user_id = ? AND title MATCH ? || '*'
      ORDER BY suggestion
      LIMIT ?
    `);

    return stmt.all(userId, prefix, limit).map(row => (row as { suggestion: string }).suggestion);
  }

  // ============================================
  // Memoir Operations
  // ============================================

  /**
   * Save memoir with Zod validation
   */
  saveMemoir(memoir: MemoirSave): void {
    const validated = memoirSaveSchema.parse(memoir);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memoirs
      (memoir_id, user_id, title, description, status, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.memoirId,
      validated.userId,
      validated.title,
      validated.description ?? null,
      validated.status,
      JSON.stringify(validated.metadata ?? {}),
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Load memoir by ID
   */
  loadMemoir(memoirId: string): MemoirSave | null {
    const row = this.db.prepare(
      "SELECT * FROM memoirs WHERE memoir_id = ?"
    ).get(memoirId) as unknown as {
      memoir_id: string;
      user_id: string;
      title: string;
      description: string | null;
      status: string;
      metadata: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      memoirId: row.memoir_id,
      userId: row.user_id,
      title: row.title,
      description: row.description ?? undefined,
      status: row.status as MemoirSave["status"],
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Load all memoirs for a user
   */
  loadMemoirs(
    userId: string,
    status?: MemoirSave["status"]
  ): ReadonlyArray<MemoirSave> {
    let sql = "SELECT * FROM memoirs WHERE user_id = ?";
    const params: ReadonlyArray<string> = [userId];

    if (status) {
      sql += " AND status = ?";
      (params as string[]).push(status);
    }

    sql += " ORDER BY created_at DESC";

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as ReadonlyArray<unknown>;

    return rows.map(row => {
      const r = row as {
        memoir_id: string;
        user_id: string;
        title: string;
        description: string | null;
        status: string;
        metadata: string;
        created_at: string;
        updated_at: string;
      };

      return {
        memoirId: r.memoir_id,
        userId: r.user_id,
        title: r.title,
        description: r.description ?? undefined,
        status: r.status as MemoirSave["status"],
        metadata: JSON.parse(r.metadata) as Record<string, unknown>,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  /**
   * Delete memoir (and cascade to chapters)
   */
  deleteMemoir(memoirId: string): void {
    const stmt = this.db.prepare("DELETE FROM memoirs WHERE memoir_id = ?");
    stmt.run(memoirId);
  }

  // ============================================
  // Chapter Operations
  // ============================================

  /**
   * Save chapter with Zod validation
   */
  saveChapter(chapter: ChapterSave): void {
    const validated = chapterSaveSchema.parse(chapter);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapters
      (chapter_id, user_id, memoir_id, title, status, type, order_idx,
       created_at, updated_at, published_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.chapterId,
      validated.userId,
      validated.memoirId,
      validated.title,
      validated.status,
      validated.type,
      validated.order,
      validated.createdAt,
      validated.updatedAt,
      validated.publishedAt ?? null,
      JSON.stringify(validated.metadata ?? {})
    );
  }

  /**
   * Save chapter content with Zod validation
   */
  saveChapterContent(content: ChapterContentSave): void {
    const validated = chapterContentSaveSchema.parse(content);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapter_contents
      (content_id, chapter_id, content, markdown, word_count, character_count,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.contentId,
      validated.chapterId,
      validated.content,
      validated.markdown ?? null,
      validated.wordCount,
      validated.characterCount,
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Load chapter by ID
   */
  loadChapter(chapterId: string): ChapterSave | null {
    const row = this.db.prepare(
      "SELECT * FROM chapters WHERE chapter_id = ?"
    ).get(chapterId) as unknown as {
      chapter_id: string;
      user_id: string;
      memoir_id: string;
      title: string;
      status: string;
      type: string;
      order_idx: number;
      created_at: string;
      updated_at: string;
      published_at: string | null;
      metadata: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      chapterId: row.chapter_id,
      userId: row.user_id,
      memoirId: row.memoir_id,
      title: row.title,
      status: row.status as ChapterSave["status"],
      type: row.type as ChapterSave["type"],
      order: row.order_idx,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at ?? undefined,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    };
  }

  /**
   * Load chapter content by chapter ID
   */
  loadChapterContent(chapterId: string): ChapterContentSave | null {
    const row = this.db.prepare(
      "SELECT * FROM chapter_contents WHERE chapter_id = ?"
    ).get(chapterId) as unknown as {
      content_id: string;
      chapter_id: string;
      content: string;
      markdown: string | null;
      word_count: number;
      character_count: number;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      contentId: row.content_id,
      chapterId: row.chapter_id,
      content: row.content,
      markdown: row.markdown ?? undefined,
      wordCount: row.word_count,
      characterCount: row.character_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Load all chapters for a user with optional filters
   */
  loadChapters(params: {
    userId: string;
    memoirId?: string;
    status?: ChapterSave["status"];
    type?: ChapterSave["type"];
  }): ReadonlyArray<ChapterSave> {
    let sql = "SELECT * FROM chapters WHERE user_id = ?";
    const queryParams: ReadonlyArray<string> = [params.userId];

    if (params.memoirId) {
      sql += " AND memoir_id = ?";
      (queryParams as string[]).push(params.memoirId);
    }

    if (params.status) {
      sql += " AND status = ?";
      (queryParams as string[]).push(params.status);
    }

    if (params.type) {
      sql += " AND type = ?";
      (queryParams as string[]).push(params.type);
    }

    sql += " ORDER BY order_idx ASC";

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...queryParams) as ReadonlyArray<unknown>;

    return rows.map(row => {
      const r = row as {
        chapter_id: string;
        user_id: string;
        memoir_id: string;
        title: string;
        status: string;
        type: string;
        order_idx: number;
        created_at: string;
        updated_at: string;
        published_at: string | null;
        metadata: string;
      };

      return {
        chapterId: r.chapter_id,
        userId: r.user_id,
        memoirId: r.memoir_id,
        title: r.title,
        status: r.status as ChapterSave["status"],
        type: r.type as ChapterSave["type"],
        order: r.order_idx,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        publishedAt: r.published_at ?? undefined,
        metadata: JSON.parse(r.metadata) as Record<string, unknown>,
      };
    });
  }

  /**
   * Update chapter status
   */
  updateChapterStatus(
    chapterId: string,
    status: ChapterSave["status"],
    publishedAt?: string
  ): void {
    let sql = "UPDATE chapters SET status = ?, updated_at = datetime('now')";
    const params: ReadonlyArray<string> = [status];

    if (publishedAt) {
      sql += ", published_at = ?";
      (params as string[]).push(publishedAt);
    }

    sql += " WHERE chapter_id = ?";
    (params as string[]).push(chapterId);

    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }

  /**
   * Update chapter order
   */
  updateChapterOrder(chapterId: string, order: number): void {
    const stmt = this.db.prepare(`
      UPDATE chapters
      SET order_idx = ?, updated_at = datetime('now')
      WHERE chapter_id = ?
    `);

    stmt.run(order, chapterId);
  }

  /**
   * Delete chapter (cascade to content and versions)
   */
  deleteChapter(chapterId: string): void {
    const stmt = this.db.prepare("DELETE FROM chapters WHERE chapter_id = ?");
    stmt.run(chapterId);
  }

  /**
   * Archive chapter (soft delete)
   */
  archiveChapter(chapterId: string): void {
    const stmt = this.db.prepare(`
      UPDATE chapters
      SET status = 'archived', updated_at = datetime('now')
      WHERE chapter_id = ?
    `);

    stmt.run(chapterId);
  }

  /**
   * Get next chapter order for a memoir
   */
  getNextChapterOrder(memoirId: string): number {
    const row = this.db.prepare(
      "SELECT COALESCE(MAX(order_idx), -1) + 1 as next_order FROM chapters WHERE memoir_id = ?"
    ).get(memoirId) as { next_order: number };

    return row.next_order;
  }

  // ============================================
  // Chapter Version Operations
  // ============================================

  /**
   * Save chapter version with Zod validation
   */
  saveChapterVersion(version: ChapterVersionSave): void {
    const validated = chapterVersionSaveSchema.parse(version);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapter_versions
      (version_id, chapter_id, version_number, content, markdown,
       change_type, change_description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.versionId,
      validated.chapterId,
      validated.versionNumber,
      validated.content,
      validated.markdown ?? null,
      validated.changeType,
      validated.changeDescription ?? null,
      validated.createdBy ?? null,
      validated.createdAt
    );
  }

  /**
   * Load chapter version by ID
   */
  loadChapterVersion(versionId: string): ChapterVersionSave | null {
    const row = this.db.prepare(
      "SELECT * FROM chapter_versions WHERE version_id = ?"
    ).get(versionId) as unknown as {
      version_id: string;
      chapter_id: string;
      version_number: number;
      content: string;
      markdown: string | null;
      change_type: string;
      change_description: string | null;
      created_by: string | null;
      created_at: string;
    } | undefined;

    if (!row) {
      return null;
    }

    return {
      versionId: row.version_id,
      chapterId: row.chapter_id,
      versionNumber: row.version_number,
      content: row.content,
      markdown: row.markdown ?? undefined,
      changeType: row.change_type as ChapterVersionSave["changeType"],
      changeDescription: row.change_description ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Load all versions for a chapter
   */
  loadChapterVersions(
    chapterId: string
  ): ReadonlyArray<ChapterVersionSave> {
    const stmt = this.db.prepare(`
      SELECT * FROM chapter_versions
      WHERE chapter_id = ?
      ORDER BY version_number DESC
    `);

    const rows = stmt.all(chapterId) as ReadonlyArray<unknown>;

    return rows.map(row => {
      const r = row as {
        version_id: string;
        chapter_id: string;
        version_number: number;
        content: string;
        markdown: string | null;
        change_type: string;
        change_description: string | null;
        created_by: string | null;
        created_at: string;
      };

      return {
        versionId: r.version_id,
        chapterId: r.chapter_id,
        versionNumber: r.version_number,
        content: r.content,
        markdown: r.markdown ?? undefined,
        changeType: r.change_type as ChapterVersionSave["changeType"],
        changeDescription: r.change_description ?? undefined,
        createdBy: r.created_by ?? undefined,
        createdAt: r.created_at,
      };
    });
  }

  /**
   * Get latest version number for a chapter
   */
  getLatestChapterVersionNumber(chapterId: string): number {
    const row = this.db.prepare(
      "SELECT COALESCE(MAX(version_number), 0) as max_version FROM chapter_versions WHERE chapter_id = ?"
    ).get(chapterId) as { max_version: number };

    return row.max_version;
  }

  /**
   * Delete chapter versions
   */
  deleteChapterVersions(chapterId: string): void {
    const stmt = this.db.prepare("DELETE FROM chapter_versions WHERE chapter_id = ?");
    stmt.run(chapterId);
  }

  /**
   * Delete old chapter versions (keep only latest N)
   */
  pruneOldChapterVersions(chapterId: string, keepCount: number = 10): void {
    this.db.prepare(`
      DELETE FROM chapter_versions
      WHERE chapter_id = ? AND version_number NOT IN (
        SELECT version_number FROM chapter_versions
        WHERE chapter_id = ?
        ORDER BY version_number DESC
        LIMIT ?
      )
    `).run(chapterId, chapterId, keepCount);
  }

  // ============================================
  // Chapter Export Operations
  // ============================================

  /**
   * Export chapter as Markdown
   */
  exportChapterAsMarkdown(chapterId: string): string | null {
    const chapter = this.loadChapter(chapterId);
    const content = this.loadChapterContent(chapterId);

    if (!chapter || !content) {
      return null;
    }

    let markdown = `# ${chapter.title}\n\n`;
    markdown += `**Type:** ${chapter.type}\n`;
    markdown += `**Status:** ${chapter.status}\n`;
    markdown += `**Created:** ${new Date(chapter.createdAt).toLocaleString()}\n`;
    markdown += `**Updated:** ${new Date(chapter.updatedAt).toLocaleString()}\n\n`;

    if (content.markdown) {
      markdown += content.markdown;
    } else {
      markdown += content.content;
    }

    return markdown;
  }

  /**
   * Export chapters for a memoir as combined Markdown
   */
  exportMemoirAsMarkdown(memoirId: string): string | null {
    const memoir = this.loadMemoir(memoirId);

    if (!memoir) {
      return null;
    }

    const chapters = this.loadChapters({ userId: memoir.userId, memoirId });

    if (chapters.length === 0) {
      return null;
    }

    let markdown = `# Memoir\n\n`;
    markdown += `**Chapter Count:** ${chapters.length}\n`;
    markdown += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    for (const chapter of chapters) {
      const chapterMarkdown = this.exportChapterAsMarkdown(chapter.chapterId);
      if (chapterMarkdown) {
        markdown += chapterMarkdown + "\n\n";
        markdown += "---\n\n";
      }
    }

    return markdown;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database path (for debugging)
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Execute a transaction with automatic rollback on error
   *
   * @param callback - Function to execute within the transaction
   * @returns The result of the callback
   * @throws If the callback throws, the transaction is rolled back
   */
  transaction<T>(callback: () => T): T {
    return this.db.transaction(callback)();
  }

  /**
   * Execute an immediate transaction (for better concurrency)
   *
   * @param callback - Function to execute within the transaction
   * @returns The result of the callback
   */
  transactionImmediate<T>(callback: () => T): T {
    // Use PRAGMA read_uncommitted for better concurrency
    this.db.pragma("read_uncommitted = true");
    try {
      return this.db.transaction(callback)();
    } finally {
      this.db.pragma("read_uncommitted = false");
    }
  }

  /**
   * Execute an exclusive transaction (for write-heavy operations)
   *
   * @param callback - Function to execute within the transaction
   * @returns The result of the callback
   */
  transactionExclusive<T>(callback: () => T): T {
    // Use BEGIN IMMEDIATE for better write concurrency
    this.db.exec("BEGIN IMMEDIATE TRANSACTION");
    try {
      const result = callback();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  /**
   * Get all data for a specific user (user isolation)
   *
   * @param userId - The user ID
   * @returns All user data including interviews, timeline events, voice profile, and MemCube items
   */
  getUserData(userId: string): {
    interviews: ReadonlyArray<{
      interviewId: string;
      userId: string;
      status: "active" | "paused" | "completed";
      startedAt: string;
      completedAt?: string;
      currentPhase: string;
      metadata: Record<string, unknown>;
    }>;
    timelineEvents: ReadonlyArray<{
      eventId: string;
      timelineId: string;
      userId: string;
      date: {
        type: "exact" | "era" | "approximate";
        year?: number;
        month?: number;
        day?: number;
        era?: string;
        range?: number;
      };
      title: string;
      description: string;
      category: string;
      importance: "critical" | "high" | "medium" | "low";
      confidence: number;
    }>;
    voiceProfile: {
      profileId: string;
      userId: string;
      characteristics: Record<string, unknown>;
      confidence: number;
    } | null;
    memcubeItems: ReadonlyArray<{
      cubeId: string;
      itemId: string;
      content: string;
      itemType: string;
      status: string;
      embeddingId?: string;
    }>;
  } {
    const interviewsStmt = this.db.prepare(`
      SELECT interview_id, user_id, status, started_at, completed_at, current_phase, metadata
      FROM interviews
      WHERE user_id = ?
      ORDER BY started_at DESC
    `);

    const interviews = interviewsStmt.all(userId) as ReadonlyArray<{
      interview_id: string;
      user_id: string;
      status: "active" | "paused" | "completed";
      started_at: string;
      completed_at: string | null;
      current_phase: string;
      metadata: string;
    }>;

    const timelineEvents = this.loadTimelineEvents(userId).map(event => ({
      ...event,
      userId,
    }));

    const voiceProfile = this.loadVoiceProfile(userId);
    const memcubeItems = this.loadMemCubeItems(userId);

    return {
      interviews: interviews.map(row => ({
        interviewId: row.interview_id,
        userId: row.user_id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at ?? undefined,
        currentPhase: row.current_phase,
        metadata: JSON.parse(row.metadata),
      })),
      timelineEvents,
      voiceProfile,
      memcubeItems,
    };
  }

  /**
   * Delete all data for a specific user (transaction-protected)
   *
   * @param userId - The user ID to delete
   */
  deleteUser(userId: string): void {
    this.transaction(() => {
      // Delete will cascade due to foreign keys:
      // - interview_questions (via interview_id)
      // - interview_answers (via interview_id)
      // - voice_samples (via profile_id)
      // - memcube_collections (via parent_collection_id)

      // Delete interviews (will cascade to questions and answers)
      const deleteInterviews = this.db.prepare(`
        DELETE FROM interviews WHERE user_id = ?
      `);

      // Delete timeline events
      const deleteTimelineEvents = this.db.prepare(`
        DELETE FROM timeline_events WHERE user_id = ?
      `);

      // Delete voice profile (will cascade to voice_samples)
      const deleteVoiceProfile = this.db.prepare(`
        DELETE FROM voice_profiles WHERE user_id = ?
      `);

      // Delete MemCube items
      const deleteMemCubeItems = this.db.prepare(`
        DELETE FROM memcube_items WHERE user_id = ?
      `);

      // Delete MemCube collections
      const deleteMemCubeCollections = this.db.prepare(`
        DELETE FROM memcube_collections WHERE user_id = ?
      `);

      deleteInterviews.run(userId);
      deleteTimelineEvents.run(userId);
      deleteVoiceProfile.run(userId);
      deleteMemCubeItems.run(userId);
      deleteMemCubeCollections.run(userId);
    });
  }

  /**
   * Create a savepoint for nested transactions
   *
   * @param savepointName - Name for the savepoint
   * @returns An object with release and rollback methods
   */
  createSavepoint(savepointName: string): {
    release: () => void;
    rollback: () => void;
  } {
    this.db.exec(`SAVEPOINT ${savepointName}`);

    return {
      release: () => {
        this.db.exec(`RELEASE SAVEPOINT ${savepointName}`);
      },
      rollback: () => {
        this.db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      },
    };
  }
}
