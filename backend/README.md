# Netflix Clone — Backend

Node.js + Express + PostgreSQL API for the Netflix-clone frontend. Built for a college presentation project.

## Features

- **Auth** — signup / login with JWT, passwords hashed with bcrypt
- **Profiles** — multiple profiles per account (incl. Kids profile flag), matching the frontend's profile switcher
- **Movie catalog** — full CRUD, filter by type/genre, trending & popular endpoints
- **My List** — add/remove per profile
- **Watch progress** — resume / "Continue Watching" tracking per profile
- **Search** — title and genre search, respects Kids mode

## Stack

- Express 4
- PostgreSQL (via `pg`)
- JWT auth (`jsonwebtoken`) + `bcryptjs`
- `helmet`, `cors`, `morgan`

## Project structure

```
netflix-backend/
├── src/
│   ├── config/db.js          # PostgreSQL pool
│   ├── db/
│   │   ├── schema.sql        # table definitions
│   │   ├── migrate.js        # runs schema.sql
│   │   └── seed.js           # seeds demo movies + demo user
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── errorHandler.js
│   ├── controllers/          # route handlers (business logic)
│   ├── routes/                # route -> controller wiring
│   └── server.js             # app entrypoint
├── package.json
└── .env.example
```

## Setup

1. **Install PostgreSQL** locally (or use a hosted instance), and create a database:
   ```bash
   createdb netflix_clone
   ```

2. **Install dependencies**
   ```bash
   cd netflix-backend
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # edit .env — set DATABASE_URL and JWT_SECRET
   ```

4. **Run migrations** (creates tables)
   ```bash
   npm run migrate
   ```

5. **Seed sample data** (48 mock movies + a demo account: `demo@example.com` / `password123`)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm run dev     # with nodemon, auto-restart
   # or
   npm start
   ```

   API will be running at `http://localhost:5000`.

## API Reference

All request/response bodies are JSON. Authenticated routes require:
`Authorization: Bearer <token>`

### Auth
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` | Create account + default profile, returns token |
| POST | `/api/auth/login` | `{ email, password }` | Returns token + profiles |
| GET | `/api/auth/me` | — | Current user + profiles (auth required) |

### Profiles (auth required)
| Method | Route | Body | Description |
|---|---|---|---|
| GET | `/api/profiles` | — | List profiles for the logged-in user |
| POST | `/api/profiles` | `{ name, isKids }` | Create a profile |
| PATCH | `/api/profiles/:id` | `{ name?, isKids? }` | Update a profile |
| DELETE | `/api/profiles/:id` | — | Delete a profile |

### Movies
| Method | Route | Query/Body | Description |
|---|---|---|---|
| GET | `/api/movies` | `?type=&genre=&kidsOnly=&page=&limit=` | Browse/filter catalog |
| GET | `/api/movies/trending` | — | Trending row |
| GET | `/api/movies/popular` | — | Sorted by rating |
| GET | `/api/movies/:id` | — | Movie details |
| POST | `/api/movies` | movie fields | Create (auth required) |
| PUT | `/api/movies/:id` | movie fields | Update (auth required) |
| DELETE | `/api/movies/:id` | — | Delete (auth required) |

### My List (auth required)
| Method | Route | Description |
|---|---|---|
| GET | `/api/lists/:profileId` | Get a profile's list |
| POST | `/api/lists/:profileId/:movieId` | Add a movie |
| DELETE | `/api/lists/:profileId/:movieId` | Remove a movie |

### Watch Progress (auth required)
| Method | Route | Body | Description |
|---|---|---|---|
| GET | `/api/progress/:profileId` | — | Get "Continue Watching" items |
| PUT | `/api/progress/:profileId/:movieId` | `{ progressPct }` | Update progress |

### Search
| Method | Route | Query | Description |
|---|---|---|---|
| GET | `/api/search` | `?q=&kidsOnly=` | Search by title or genre |

## Notes for the presentation

- The seed data intentionally mirrors the mock data already generated in the frontend (`makeMovies()` in the `.jsx` file), so the API's catalog matches what the UI expects — same genres, same title patterns.
- `my_list` and `watch_progress` are scoped to **profiles**, not users directly — this matches how the real Netflix works (one account, many profiles, each with its own list/progress).
- Passwords are never stored in plain text (`bcryptjs` hashing).
- To connect the frontend, replace the frontend's local `useState` calls for movies / myList / progress with `fetch` calls to these endpoints, and store the JWT (e.g. in memory or `httpOnly` cookie — avoid `localStorage` for production-grade apps).
