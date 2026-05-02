
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    tab_number VARCHAR(20) UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    position VARCHAR(200),
    department VARCHAR(200),
    category VARCHAR(50),
    work_schedule VARCHAR(200),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50),
    name TEXT NOT NULL,
    group_name VARCHAR(200),
    unit VARCHAR(50),
    norm_per_hour NUMERIC(10,4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    order_date DATE,
    master_name VARCHAR(200),
    approver_name VARCHAR(200),
    approver_position VARCHAR(300),
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_brigades (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    brigade_number INTEGER DEFAULT 1,
    brigade_name VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS order_lines (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    brigade_id INTEGER REFERENCES order_brigades(id),
    employee_id INTEGER REFERENCES employees(id),
    employee_name VARCHAR(200),
    position VARCHAR(200),
    shift1_start VARCHAR(10),
    shift1_end VARCHAR(10),
    shift2_start VARCHAR(10),
    shift2_end VARCHAR(10),
    hours_plan NUMERIC(5,2),
    hours_fact NUMERIC(5,2),
    is_ok BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS timesheet (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    employee_name VARCHAR(200),
    tab_number VARCHAR(20),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    mark VARCHAR(10),
    hours NUMERIC(5,2),
    UNIQUE (tab_number, year, month, day)
);

CREATE TABLE IF NOT EXISTS import_log (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(300),
    file_type VARCHAR(50),
    rows_imported INTEGER DEFAULT 0,
    rows_error INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ok',
    error_msg TEXT,
    imported_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timesheet_emp_year_month ON timesheet(year, month, tab_number);
CREATE INDEX IF NOT EXISTS idx_employees_category ON employees(category);
CREATE INDEX IF NOT EXISTS idx_employees_tab ON employees(tab_number);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
