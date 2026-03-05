CREATE TYPE mode_status AS ENUM ('roommate', 'friends', 'found_roommate');
CREATE TYPE enforcement_state AS ENUM ('none', 'warning', 'dm_ban_48h', 'suspended_7d', 'permanent_ban');
CREATE TYPE thread_status AS ENUM ('active', 'unmatched', 'blocked');
CREATE TYPE report_reason AS ENUM (
  'harassment', 'sexual_content', 'hate_speech', 'spam',
  'impersonation', 'underage', 'safety_threat', 'other'
);
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE enforcement_action_type AS ENUM ('warning', 'dm_ban_48h', 'suspended_7d', 'permanent_ban');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
