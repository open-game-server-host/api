CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ips (
    id SERIAL PRIMARY KEY,
    ipv4 INET,
    ipv6 INET
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    iso_3166_1_a3_code CHAR(3) NOT NULL,
    price_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00
);

CREATE TABLE daemons (
    id SERIAL PRIMARY KEY,
    ip_id INTEGER NOT NULL REFERENCES ips(id) ON DELETE RESTRICT,
    port_range_start INTEGER NOT NULL,
    port_range_end INTEGER NOT NULL,
    segments INTEGER,
    segments_used INTEGER DEFAULT 0,
    cpu_name TEXT,
    sftp_port INTEGER,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    os VARCHAR(10),
    cpu_arch VARCHAR(50),
    port_range_id INTEGER NOT NULL REFERENCES ip_port_ranges(id) ON DELETE RESTRICT,

    CHECK (range_start <= range_end)
);

CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    daemon_id INTEGER NOT NULL REFERENCES daemons(id) ON DELETE RESTRICT,
    app VARCHAR(30),
    variant VARCHAR(30),
    version VARCHAR(30),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    terminate_at TIMESTAMP,
    contract_length_days INTEGER,
    locked BOOLEAN DEFAULT FALSE,
    name VARCHAR(30),
    free BOOLEAN DEFAULT FALSE
);

CREATE TABLE users_containers (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    UNIQUE(user_id, container_id)
);

CREATE TABLE container_ports (
    id SERIAL PRIMARY KEY,
    container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    host_port INTEGER NOT NULL,
    container_port INTEGER NOT NULL
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_daemons_region_id ON daemons(region_id);
CREATE INDEX idx_containers_daemon_id ON containers(daemon_id);
CREATE INDEX idx_containers_user_id ON containers(user_id);
CREATE INDEX idx_users_containers_user_id ON users_containers(user_id);
CREATE INDEX idx_users_containers_container_id ON users_containers(container_id);
CREATE INDEX idx_container_ports_container_id ON container_ports(container_id);