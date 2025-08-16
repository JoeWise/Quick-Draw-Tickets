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
  seating_layout_id INTEGER NOT NULL REFERENCES seating_layouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assigned', 'ga')),

  UNIQUE (seating_layout_id, name)
);

CREATE TABLE section_seats (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES layout_sections(id) ON DELETE CASCADE,
  row TEXT,
  seat_number TEXT NOT NULL,
  seat_label TEXT GENERATED ALWAYS AS (
    COALESCE(row || '-', '') || seat_number
  ) STORED,

  UNIQUE (section_id, seat_label)
);

CREATE TABLE pricing_layouts (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  seating_layout_id INTEGER NOT NULL REFERENCES seating_layouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  UNIQUE (venue_id, seating_layout_id, name)
);

CREATE TABLE seat_prices (
  id SERIAL PRIMARY KEY,
  pricing_layout_id INTEGER NOT NULL REFERENCES pricing_layouts(id) ON DELETE CASCADE,
  section_id INTEGER NOT NULL REFERENCES layout_sections(id) ON DELETE CASCADE,
  seat_id INTEGER NOT NULL REFERENCES section_seats(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,

  UNIQUE (pricing_layout_id, seat_id)
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,  -- UTC
  end_datetime TIMESTAMPTZ NOT NULL,    -- UTC
  timezone TEXT NOT NULL,               -- IANA Timezone 
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  seating_layout_id INTEGER NOT NULL REFERENCES seating_layouts(id),
  pricing_layout_id INTEGER NOT NULL REFERENCES pricing_layouts(id)
);

CREATE TYPE ticket_status AS ENUM ('pending', 'purchased');

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  section_id INTEGER NOT NULL REFERENCES layout_sections(id),
  seat_id INTEGER NOT NULL REFERENCES section_seats(id),
  status ticket_status NOT NULL DEFAULT 'pending',
  reserved_until TIMESTAMPTZ NOT NULL,    -- UTC
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (event_id, seat_id)
);

CREATE TYPE venue_user_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE venue_users (
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role venue_user_role NOT NULL DEFAULT 'owner',

    PRIMARY KEY (venue_id, user_id)
);

CREATE OR REPLACE FUNCTION check_pricing_layout_seating_layout_match()
RETURNS TRIGGER AS $$
DECLARE
  seating_layout_id_from_pricing_layout INTEGER;
BEGIN
  SELECT seating_layout_id INTO seating_layout_id_from_pricing_layout
  FROM pricing_layouts
  WHERE id = NEW.pricing_layout_id;

  IF seating_layout_id_from_pricing_layout <> NEW.seating_layout_id THEN
    RAISE EXCEPTION 'Pricing seating_layout_id % does not match event seating_layout_id %',
      seating_layout_id_from_pricing_layout, NEW.seating_layout_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_event_pricing_layout
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION check_pricing_layout_seating_layout_match();
