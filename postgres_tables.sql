CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth_uid VARCHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TODO users_permissions table

CREATE TABLE ipv4 (
    id SERIAL PRIMARY KEY,
    ip INET
);

CREATE TABLE ipv6 (
    id SERIAL PRIMARY KEY,
    ip INET
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    country_code CHAR(3) NOT NULL,
    price_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00
);

CREATE TABLE daemons (
    api_key_hash TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cpu_arch VARCHAR(10) DEFAULT NULL,
    cpu_name TEXT DEFAULT NULL,
    id SERIAL PRIMARY KEY,
    ipv4_id INTEGER DEFAULT NULL REFERENCES ipv4(id) ON DELETE RESTRICT,
    ipv6_id INTEGER DEFAULT NULL REFERENCES ipv6(id) ON DELETE RESTRICT,
    ipv4_port_range_start INTEGER DEFAULT NULL,
    ipv4_port_range_end INTEGER DEFAULT NULL,
    ipv6_port_range_start INTEGER DEFAULT NULL,
    ipv6_port_range_end INTEGER DEFAULT NULL,
    os VARCHAR(10) DEFAULT NULL,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    segments INTEGER DEFAULT NULL,
    segments_available INTEGER DEFAULT NULL,
    setup_complete BOOLEAN DEFAULT FALSE,

    CHECK (ipv4_port_range_start <= ipv4_port_range_end),
    CHECK (ipv6_port_range_start <= ipv6_port_range_end)
);

CREATE TABLE containers (
    app_id VARCHAR(30),
    contract_length_days INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daemon_id INTEGER NOT NULL REFERENCES daemons(id) ON DELETE RESTRICT,
    free BOOLEAN DEFAULT FALSE,
    id SERIAL PRIMARY KEY,
    locked BOOLEAN DEFAULT FALSE,
    name VARCHAR(30),
    runtime VARCHAR(20),
    segments INTEGER,
    terminate_at TIMESTAMP DEFAULT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id VARCHAR(30),
    version_id VARCHAR(30)
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

CREATE INDEX idx_users_auth_uid ON users(auth_uid);
CREATE INDEX idx_daemons_region_id ON daemons(region_id);
CREATE INDEX idx_containers_daemon_id ON containers(daemon_id);
CREATE INDEX idx_containers_user_id ON containers(user_id);
CREATE INDEX idx_users_containers_user_id ON users_containers(user_id);
CREATE INDEX idx_users_containers_container_id ON users_containers(container_id);
CREATE INDEX idx_container_ipv4_ports_container_id ON container_ipv4_ports(container_id);
CREATE INDEX idx_container_ipv6_ports_container_id ON container_ipv6_ports(container_id);