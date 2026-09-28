ALTER TABLE forum_posts ADD COLUMN category TEXT NOT NULL DEFAULT 'General Discussions';
ALTER TABLE forum_posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
