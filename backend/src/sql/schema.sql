CREATE EXTENSION postgis

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  geog geography
);

CREATE TABLE seating_layouts (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  name TEXT NOT NULL,

  UNIQUE (venue_id, name)
);

CREATE TABLE layout_sections (
  id SERIAL PRIMARY KEY,
  layout_id INTEGER NOT NULL REFERENCES seating_layouts(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assigned', 'ga')),

  UNIQUE (layout_id, name)
);

CREATE TABLE section_seats (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES layout_sections(id),
  row TEXT,
  seat_number TEXT NOT NULL,
  seat_label TEXT GENERATED ALWAYS AS (
    COALESCE(row || '-', '') || seat_number
  ) STORED,

  UNIQUE (section_id, seat_label)
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  layout_id INTEGER NOT NULL REFERENCES seating_layouts(id)
);

CREATE TYPE ticket_status AS ENUM ('pending', 'purchased');

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  section_id INTEGER NOT NULL REFERENCES layout_sections(id),
  seat_id INTEGER REFERENCES section_seats(id),
  status ticket_status NOT NULL DEFAULT 'pending',
  reserved_until TIMESTAMP,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (event_id, seat_id)
);

CREATE TYPE venue_user_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE venue_users (
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role venue_user_role NOT NULL DEFAULT 'owner',

    PRIMARY KEY (venue_id, user_id)
);
