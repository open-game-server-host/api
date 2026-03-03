CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth_uid VARCHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    permission TEXT NOT NULL,

    UNIQUE (user_id, permission)
);

CREATE TABLE ips (
    id SERIAL PRIMARY KEY,
    ip INET UNIQUE,
    version SMALLINT
);

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    country_code CHAR(3) NOT NULL,
    price_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00
);

CREATE TABLE daemons (
    id SERIAL PRIMARY KEY,
    api_key_hash TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cpu_arch VARCHAR(10) DEFAULT NULL,
    cpu_name TEXT DEFAULT NULL,
    port_range_start INTEGER DEFAULT 0,
    port_range_end INTEGER DEFAULT 0,
    os VARCHAR(10) DEFAULT NULL,
    region_id INTEGER DEFAULT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    segments_usable INTEGER DEFAULT 0,
    segments_available INTEGER DEFAULT 0,
    segments_max INTEGER DEFAULT 0,
    setup_complete BOOLEAN DEFAULT FALSE,

    CHECK (port_range_start <= port_range_end),
    CHECK (port_range_start > 1024),
    CHECK (port_range_end <= 65535)
);

CREATE TABLE daemon_ips (
    id SERIAL PRIMARY KEY,
    daemon_id INTEGER NOT NULL REFERENCES daemons(id) ON DELETE CASCADE,
    ip_id INTEGER NOT NULL REFERENCES ips(id) ON DELETE RESTRICT
)

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

    UNIQUE (user_id, container_id)
);

CREATE TABLE container_permissions (
    container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,

    UNIQUE (container_id, user_id, permission)
);

CREATE TABLE container_ports (
    id SERIAL PRIMARY KEY,
    ip_id INTEGER NOT NULL REFERENCES ips(id) ON DELETE CASCADE,
    host_port INTEGER NOT NULL,
    container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    container_port INTEGER NOT NULL,

    UNIQUE (ip_id, host_port)
);

CREATE INDEX idx_users_auth_uid ON users(auth_uid);
CREATE INDEX idx_daemons_region_id ON daemons(region_id);
CREATE INDEX idx_containers_daemon_id ON containers(daemon_id);
CREATE INDEX idx_containers_user_id ON containers(user_id);
CREATE INDEX idx_users_containers_user_id ON users_containers(user_id);
CREATE INDEX idx_users_containers_container_id ON users_containers(container_id);
CREATE INDEX idx_container_ipv4_ports_container_id ON container_ipv4_ports(container_id);
CREATE INDEX idx_container_ipv6_ports_container_id ON container_ipv6_ports(container_id);