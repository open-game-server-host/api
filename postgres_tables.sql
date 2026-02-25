CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    authUid VARCHAR(36) NOT NULL UNIQUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    iso31661a3code CHAR(3) NOT NULL,
    priceMultiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00
);

CREATE TABLE daemons (
    apiKeyHash TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cpuArch VARCHAR(10),
    cpuName TEXT,
    id SERIAL PRIMARY KEY,
    ipv4Id INTEGER DEFAULT NULL REFERENCES ipv4(id) ON DELETE RESTRICT,
    ipv6Id INTEGER DEFAULT NULL REFERENCES ipv6(id) ON DELETE RESTRICT,
    ipv4PortRangeStart INTEGER NOT NULL,
    ipv4PortRangeEnd INTEGER NOT NULL,
    ipv6PortRangeStart INTEGER NOT NULL,
    ipv6PortRangeEnd INTEGER NOT NULL,
    os VARCHAR(10),
    regionId INTEGER NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    segments INTEGER,
    segmentsUsed INTEGER DEFAULT 0,

    CHECK (ipv4PortRangeStart <= ipv4PortRangeEnd),
    CHECK (ipv6PortRangeStart <= ipv6PortRangeEnd)
);

CREATE TABLE containers (
    appId VARCHAR(30),
    contractLengthDays INTEGER,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daemonId INTEGER NOT NULL REFERENCES daemons(id) ON DELETE RESTRICT,
    free BOOLEAN DEFAULT FALSE,
    id SERIAL PRIMARY KEY,
    locked BOOLEAN DEFAULT FALSE,
    name VARCHAR(30),
    runtime VARCHAR(20),
    segments INTEGER,
    terminateAt TIMESTAMP DEFAULT NULL,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variantId VARCHAR(30),
    versionId VARCHAR(30)
);

CREATE TABLE users_containers (
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    containerId INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    UNIQUE(userId, containerId)
);

CREATE TABLE container_ipv4_ports (
    id SERIAL PRIMARY KEY,
    containerId INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    hostPort INTEGER NOT NULL,
    containerPort INTEGER NOT NULL
);

CREATE TABLE container_ipv6_ports (
    id SERIAL PRIMARY KEY,
    containerId INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
    hostPort INTEGER NOT NULL,
    containerPort INTEGER NOT NULL
);

CREATE INDEX idx_users_auth_uid ON users(authUid);
CREATE INDEX idx_daemons_region_id ON daemons(regionId);
CREATE INDEX idx_containers_daemon_id ON containers(daemonId);
CREATE INDEX idx_containers_user_id ON containers(userId);
CREATE INDEX idx_users_containers_user_id ON users_containers(userId);
CREATE INDEX idx_users_containers_container_id ON users_containers(containerId);
CREATE INDEX idx_container_ipv4_ports_container_id ON container_ipv4_ports(containerId);
CREATE INDEX idx_container_ipv6_ports_container_id ON container_ipv6_ports(containerId);