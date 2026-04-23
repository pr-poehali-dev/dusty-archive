
CREATE TABLE IF NOT EXISTS product_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executors (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  product_type_id INTEGER REFERENCES product_types(id),
  competitor_id INTEGER REFERENCES competitors(id),
  submission_date DATE,
  quantity NUMERIC(15,2),
  competitor_price NUMERIC(15,2),
  our_price NUMERIC(15,2),
  percent NUMERIC(10,4),
  our_coefficient NUMERIC(10,4),
  note TEXT,
  executor_id INTEGER REFERENCES executors(id),
  purchase_link TEXT,
  is_important BOOLEAN DEFAULT FALSE,
  is_rejected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO product_types (name) VALUES ('Металлопрокат'), ('Трубы'), ('Кабель'), ('Оборудование') ON CONFLICT DO NOTHING;
INSERT INTO competitors (name) VALUES ('ООО Альфа'), ('ООО Бета'), ('ЗАО Гамма') ON CONFLICT DO NOTHING;
INSERT INTO executors (full_name) VALUES ('Иванов Иван Иванович'), ('Петрова Мария Сергеевна'), ('Сидоров Алексей Петрович') ON CONFLICT DO NOTHING;
