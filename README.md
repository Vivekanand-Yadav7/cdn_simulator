# CDN Simulator

A Content Delivery Network simulator built with Node.js, NGINX, Redis, and Docker. Demonstrates core CDN concepts — edge caching, cache hit/miss logic, load balancing, and origin fallback — running entirely on a local machine.

---

## Architecture

```
Client
  │
  ▼
NGINX Load Balancer  (port 8080)
  │   Round-robin across 3 CDN nodes
  ├──▶ CDN Node api1 (port 3000)
  ├──▶ CDN Node api2 (port 3000)
  └──▶ CDN Node api3 (port 3000)
         │
         │  Cache MISS → fetch from origin
         ▼
      Origin Server  (port 4000)
         │
         ▼
    PostgreSQL (Neon)   +   Redis (Upstash)
    (file metadata)         (edge cache)
```

**Request flow:**
1. Client hits NGINX on port `8080`
2. NGINX distributes the request to one of the three CDN nodes (round-robin)
3. CDN node checks Redis — **Cache HIT** → respond immediately with `X-Cache: HIT`
4. **Cache MISS** → fetch content from origin server, store in Redis with TTL, respond with `X-Cache: MISS`
5. Subsequent requests for the same file are served from cache without touching the origin

---

## Tech Stack

| Layer | Technology |
|---|---|
| CDN Nodes | Node.js + Express |
| Load Balancer | NGINX (round-robin) |
| Edge Cache | Redis (Upstash) |
| Origin Server | Node.js + Express |
| Database | PostgreSQL (Neon) |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
cdn_simulator/
├── cdn-node/               # CDN edge node (3 instances run via Docker)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Cache and origin fetch logic
│   │   ├── routes/         # Express route definitions
│   │   ├── redis.js        # Redis client (Upstash)
│   │   ├── app.js          # Express app
│   │   └── server.js       # Entry point
│   └── Dockerfile
├── origin-server/          # Origin — source of truth for content
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── db.js           # PostgreSQL connection (Neon)
│   │   └── app.js
│   └── Dockerfile
├── nginx/
│   └── nginx.conf          # Upstream + proxy config
└── docker-compose.yml      # Orchestrates all services
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- A free [Upstash](https://upstash.com) Redis instance
- A free [Neon](https://neon.tech) PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/Vivekanand-Yadav7/cdn_simulator.git
cd cdn_simulator
```

### 2. Set up environment variables

Create `cdn-node/.env`:
```env
PORT=3000
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Create `origin-server/.env`:
```env
PORT=4000
DATABASE_URL=your_neon_postgres_connection_string
```

### 3. Start the stack

```bash
docker compose up --build -d
```

This starts:
- `origin-server` on port `4000`
- `api1`, `api2`, `api3` (CDN nodes) on internal port `3000`
- `cdn-load-balancer` (NGINX) on port `8080`

### 4. Verify all containers are running

```bash
docker compose ps
```

---

## Usage

### Health check — observe round-robin load balancing

```bash
for i in {1..12}; do
  curl -s --no-keepalive http://localhost:8080/health
  echo
done
```

Expected output — NGINX cycling through all three nodes:
```
Node ID: api1
Node ID: api2
Node ID: api3
Node ID: api1
Node ID: api2
Node ID: api3
...
```

### Fetch content through the CDN

```bash
# First request — Cache MISS (fetches from origin)
curl -v http://localhost:8080/content/hello.txt

# Second request — Cache HIT (served from Redis)
curl -v http://localhost:8080/content/hello.txt
```

Check the `X-Cache` response header:
- `X-Cache: MISS` — served from origin, now cached
- `X-Cache: HIT` — served from Redis edge cache

### View live NGINX traffic logs

```bash
docker compose logs -f nginx
```

---

## Key Concepts Demonstrated

| Concept | Implementation |
|---|---|
| **Edge Caching** | Redis stores content at the CDN node with a configurable TTL (default 5 min) |
| **Cache HIT/MISS** | `X-Cache` response header on every request |
| **Load Balancing** | NGINX round-robin across 3 identical CDN node instances |
| **Cache Invalidation** | `invalidateCache()` method in `cacheService.js` |
| **Origin Fallback** | On cache miss, CDN transparently fetches from origin |
| **Path Traversal Protection** | `isSafeFilename()` guard on all file requests |
| **Node Identification** | Each node reports its `NODE_ID` for observability |

---

## NGINX Load Balancing

The `nginx/nginx.conf` uses upstream round-robin (NGINX default):

```nginx
upstream cdn_backend {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}
```

To switch algorithms, modify the upstream block:
- **Least connections:** add `least_conn;`
- **IP hash (sticky sessions):** add `ip_hash;`

---

## Roadmap

- [ ] Fix origin server Neon DB connectivity inside Docker
- [ ] `/stats` endpoint — expose cache hit rate, request count per node
- [ ] Cache invalidation API endpoint
- [ ] Migrate origin file storage to AWS S3
- [ ] Deploy CDN nodes to multiple AWS regions

---

## Author

**Vivekanand Yadav** — [GitHub](https://github.com/Vivekanand-Yadav7)
