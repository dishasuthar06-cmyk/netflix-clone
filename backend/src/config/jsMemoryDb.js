const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const GENRES = ["Action", "Comedy", "Horror", "Sci-Fi", "Drama", "Romance", "Thriller", "Animation"];
const WORDS = {
  Action: ["Die Hard", "Mad Max: Fury Road", "John Wick", "The Dark Knight", "Baahubali: The Beginning", "RRR"],
  Comedy: ["Superbad", "The Hangover", "3 Idiots", "Anchorman", "Hera Pheri", "Dumb and Dumber"],
  Horror: ["The Shining", "Hereditary", "Tumbbad", "A Quiet Place", "Stree", "Halloween"],
  "Sci-Fi": ["Inception", "Interstellar", "Blade Runner 2049", "The Matrix", "Koi... Mil Gaya", "Dune"],
  Drama: ["The Shawshank Redemption", "Forrest Gump", "Dangal", "Good Will Hunting", "Taare Zameen Par", "12 Years a Slave"],
  Romance: ["The Notebook", "La La Land", "Titanic", "Dilwale Dulhania Le Jayenge", "Jab We Met", "About Time"],
  Thriller: ["Se7en", "Gone Girl", "Andhadhun", "Shutter Island", "Drishyam", "No Country for Old Men"],
  Animation: ["Spirited Away", "Toy Story", "Coco", "Inside Out", "The Lion King", "Up"],
};

const POSTER_MAP = {
  "Die Hard": "https://m.media-amazon.com/images/M/MV5BNjg0NjU5MTE0MV5BMl5BanBnXkFtZTgwNTUxNDQxMDE@._V1_SX300.jpg",
  "Mad Max: Fury Road": "https://m.media-amazon.com/images/M/MV5BN2EwM2I5OWMtMGQyMi00Zjg1LWJkNTctZTdjYTA4OGUwZjMyXkEyXkFqcGc@._V1_SX300.jpg",
  "John Wick": "https://m.media-amazon.com/images/M/MV5BMTU2NjA1ODgzMF5BMl5BanBnXkFtZTgwMTM2MTI4MjE@._V1_SX300.jpg",
  "The Dark Knight": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
  "Baahubali: The Beginning": "https://m.media-amazon.com/images/M/MV5BYWVlMjVhZWYtNWViNC00ODFkLTk1MmItYjU1MDY5ZDdhMTU3XkEyXkFqcGc@._V1_SX300.jpg",
  "RRR": "https://m.media-amazon.com/images/M/MV5BODUwNDNjYzctODUxNy00ZTA2LWIyYTEtMDc5Y2E5ZjBmNTMzXkEyXkFqcGc@._V1_SX300.jpg",
  "Superbad": "https://m.media-amazon.com/images/M/MV5BMTc0NjIyNDExMV5BMl5BanBnXkFtZTcwMzQ3MTc1MQ@@._V1_SX300.jpg",
  "The Hangover": "https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI5NmU3MjE2ODQzXkEyXkFqcGc@._V1_SX300.jpg",
  "3 Idiots": "https://m.media-amazon.com/images/M/MV5BNTkyOGVjMGEtNmQzZi00NzFlLTlhOWQtODYyMDc2ZGJmYzFhXkEyXkFqcGc@._V1_SX300.jpg",
  "Anchorman": "https://m.media-amazon.com/images/M/MV5BMTQ2MzYwMzk5Ml5BMl5BanBnXkFtZTcwOTI4NzUyMw@@._V1_SX300.jpg",
  "Hera Pheri": "https://m.media-amazon.com/images/M/MV5BNmU4MmVjZGUtODc0ZC00MjgzLWFmOTQtOGRhNjg3MGVkOTM3XkEyXkFqcGc@._V1_SX300.jpg",
  "Dumb and Dumber": "https://m.media-amazon.com/images/M/MV5BZDQwMjNiMTQtY2UwYy00NjhiLTg0ZWEtZWM5ZmMxNDMKZWQ2XkEyXkFqcGc@._V1_SX300.jpg",
  "The Shining": "https://m.media-amazon.com/images/M/MV5BNmM5ZjgxY2ItMGVlNy00MTk4LTg2YjQtZjg4NTA3MmNmODc2XkEyXkFqcGc@._V1_SX300.jpg",
  "Hereditary": "https://m.media-amazon.com/images/M/MV5BOTU5MDg3OGItZWQ1Ny00ZGVmLTg2YTUtMzBkYzQ1YWIwZjlhXkEyXkFqcGc@._V1_SX300.jpg",
  "Tumbbad": "https://m.media-amazon.com/images/M/MV5BYmQxNmU4AC00NDRhLTk1YjEtOTY0ZDFkNDQwYmE0XkEyXkFqcGc@._V1_SX300.jpg",
  "A Quiet Place": "https://m.media-amazon.com/images/M/MV5BMjI0MDMzNTQ0M15BMl5BanBnXkFtZTgwMTM5NzM3NDM@._V1_SX300.jpg",
  "Stree": "https://m.media-amazon.com/images/M/MV5BNWExYzQyMTQtYmNjMS00ZTFjLWE5MGItMDlhMDBlNmI0YzcyXkEyXkFqcGc@._V1_SX300.jpg",
  "Halloween": "https://m.media-amazon.com/images/M/MV5BNzk1OGU2NmMtNTdhZC00NjdlLWE5YTMtZTQ0MGExZTQzOGQyXkEyXkFqcGc@._V1_SX300.jpg",
  "Inception": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  "Interstellar": "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg",
  "Blade Runner 2049": "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX300.jpg",
  "The Matrix": "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg",
  "Koi... Mil Gaya": "https://m.media-amazon.com/images/M/MV5BMWE3YjRiOGItMDY2Mi00MTNkLWIxYzItZTVlMjRiY2I0OGViXkEyXkFqcGc@._V1_SX300.jpg",
  "Dune": "https://m.media-amazon.com/images/M/MV5BMDQ0NjgyN2YtNWVmYi00YDRmLWE5YzItNWVkM2ExY2Q3ZDM2XkEyXkFqcGc@._V1_SX300.jpg",
  "The Shawshank Redemption": "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtYTEzNTAyOTFCYjA3XkEyXkFqcGc@._V1_SX300.jpg",
  "Forrest Gump": "https://m.media-amazon.com/images/M/MV5BNDYwNzVjMTItZmU5YS00YjQ5LTljYjgtMjY2NDVmYWMyNWFmXkEyXkFqcGc@._V1_SX300.jpg",
  "Dangal": "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_SX300.jpg",
  "Good Will Hunting": "https://m.media-amazon.com/images/M/MV5BOGZhZDIzNWMtNjkxMS00NWQ5LThjNYtNWY1NDVmOTU3ZGY2XkEyXkFqcGc@._V1_SX300.jpg",
  "Taare Zameen Par": "https://m.media-amazon.com/images/M/MV5BMDhjZWViN2MtNzgxNy00NmI5LWFmZTAtMjExNDQxZjU1NDY0XkEyXkFqcGc@._V1_SX300.jpg",
  "12 Years a Slave": "https://m.media-amazon.com/images/M/MV5BMjExMTEzODkyN15BMl5BanBnXkFtZTcwNTU4NTc4OQ@@._V1_SX300.jpg",
  "The Notebook": "https://m.media-amazon.com/images/M/MV5BMTk3OTM5Njg5M15BMl5BanBnXkFtZTYwMzA0ODI3._V1_SX300.jpg",
  "La La Land": "https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg",
  "Titanic": "https://m.media-amazon.com/images/M/MV5BYzYyN2FiZmItY2Y0Ni00NDAzLTg5N2MtODE3ZDRiNjE1M2JlXkEyXkFqcGc@._V1_SX300.jpg",
  "Dilwale Dulhania Le Jayenge": "https://m.media-amazon.com/images/M/MV5BMDQ2ZmE2NTMtZDE3NC00YzFjLWJhNmEtNDE0OGQ0YjMyN2NmXkEyXkFqcGc@._V1_SX300.jpg",
  "Jab We Met": "https://m.media-amazon.com/images/M/MV5BYzA2YzIwODUtY2JhZi00ZDUxLWIzODEtYjYyMDc4MDJmNjE1XkEyXkFqcGc@._V1_SX300.jpg",
  "About Time": "https://m.media-amazon.com/images/M/MV5BMTA1ODUzMDA3NzFeQTJeQWpwZ15BbWU3MDkxMTYxNTk@._V1_SX300.jpg",
  "Se7en": "https://m.media-amazon.com/images/M/MV5BY2IzNzMxZjctZjUxZi00YzAxLTk3ZjMtYzFjNzExMTUxZDUwXkEyXkFqcGc@._V1_SX300.jpg",
  "Gone Girl": "https://m.media-amazon.com/images/M/MV5BMTk0MDQ3OTAzOV5BMl5BanBnXkFtZTgwNzU1NzE3MjE@._V1_SX300.jpg",
  "Andhadhun": "https://m.media-amazon.com/images/M/MV5BNmVhNWVlOTYtMGEzNy00OWVmLWE5ZTgtNmNmNDBiZTM3NWRmXkEyXkFqcGc@._V1_SX300.jpg",
  "Shutter Island": "https://m.media-amazon.com/images/M/MV5BN2FjNWExZjEtYjc4Yi00NmYxLWFmOGEtMzdjMzVkNmVhNmFlXkEyXkFqcGc@._V1_SX300.jpg",
  "Drishyam": "https://m.media-amazon.com/images/M/MV5BMDRlZWFkMjEtYmYyZi00MmE5LWIzMzUtYmM2N2M5Y2UxZDJjXkEyXkFqcGc@._V1_SX300.jpg",
  "No Country for Old Men": "https://m.media-amazon.com/images/M/MV5BMjA5Njk3MjM4OV5BMl5BanBnXkFtZTcwMTc5MTE1MQ@@._V1_SX300.jpg",
  "Spirited Away": "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg",
  "Toy Story": "https://m.media-amazon.com/images/M/MV5BZTA3OWVjOWItNjE1NS00NzZiLWE1MjgtZDZhMWI1ZTlkNzYwXkEyXkFqcGc@._V1_SX300.jpg",
  "Coco": "https://m.media-amazon.com/images/M/MV5BMDIyM2E2NTAtMzlhNy00ZGUxLWI1NjgtZDY5MzhiMDc5NGU3XkEyXkFqcGc@._V1_QL75_UY562_CR7,0,380,562_.jpg",
  "Inside Out": "https://m.media-amazon.com/images/M/MV5BOTgxMDQwMDk0OF5BMl5BanBnXkFtZTgwNjU5OTg2NDE@._V1_SX300.jpg",
  "The Lion King": "https://m.media-amazon.com/images/M/MV5BZGRiZDZhZjItM2M3ZC00Y2IyLTk3Y2MtMWY5YjliNDFkZTJlXkEyXkFqcGc@._V1_SX300.jpg",
  "Up": "https://m.media-amazon.com/images/M/MV5BNmI1ZTc5MWMtMDYyOS00ZDc2LTkzOTAtNjQ4NWIxNjYyNDgzXkEyXkFqcGc@._V1_SX300.jpg"
};

const CAST_POOL = ["A. Marlow", "R. Achebe", "J. Vance", "N. Okafor", "T. Reyes", "S. Lindqvist", "M. Duarte", "K. Halvorsen"];

function titleFor(g, n) {
  const list = WORDS[g] || ["Untitled"];
  return list[n % list.length] + (n >= list.length ? ` ${Math.floor(n / list.length) + 1}` : "");
}

// In-Memory Storage
const state = {
  users: [],
  profiles: [],
  movies: [],
  my_list: [],
  watch_progress: [],
};

// Seed initial data
(function seedMemory() {
  let id = 1;
  GENRES.forEach((g) => {
    for (let i = 0; i < 6; i++) {
      const genres = [g, GENRES[(GENRES.indexOf(g) + 1 + i) % GENRES.length]];
      const title = titleFor(g, i);
      const type = id % 5 === 0 ? "tv" : "movie";
      const year = 2016 + ((id * 7) % 9);
      const rating = Number((6.2 + ((id * 13) % 38) / 10).toFixed(1));
      const duration = `${1 + (id % 2)}h ${10 + ((id * 3) % 45)}m`;
      const director = CAST_POOL[id % CAST_POOL.length];
      const cast = [CAST_POOL[id % CAST_POOL.length], CAST_POOL[(id + 2) % CAST_POOL.length], CAST_POOL[(id + 4) % CAST_POOL.length]];
      const desc = `A ${g.toLowerCase()} story of ambition, loss, and the choices that follow. Set across three cities and ten years.`;
      const poster = POSTER_MAP[title] || null;
      const isKidSafe = genres.includes("Animation") || genres.includes("Comedy");

      state.movies.push({
        id,
        title,
        type,
        year,
        rating,
        duration,
        director,
        cast,
        genres,
        description: desc,
        poster_url: poster,
        is_kid_safe: isKidSafe,
        created_at: new Date().toISOString(),
      });
      id++;
    }
  });

  const demoId = crypto.randomUUID();
  const hash = bcrypt.hashSync("password123", 10);
  state.users.push({
    id: demoId,
    name: "Demo User",
    email: "demo@example.com",
    password_hash: hash,
    created_at: new Date().toISOString(),
  });

  state.profiles.push({
    id: crypto.randomUUID(),
    user_id: demoId,
    name: "Primary",
    is_kids: false,
    avatar_seed: "default",
    created_at: new Date().toISOString(),
  });
  state.profiles.push({
    id: crypto.randomUUID(),
    user_id: demoId,
    name: "Kids",
    is_kids: true,
    avatar_seed: "kids",
    created_at: new Date().toISOString(),
  });
})();

async function query(sql, params = []) {
  const cleanSql = sql.trim();
  const lower = cleanSql.toLowerCase();

  // SELECT movies
  if (lower.startsWith("select") && lower.includes("from movies")) {
    let list = [...state.movies];

    if (lower.includes("where id =") || lower.includes("where id=")) {
      const matchId = params[0];
      const found = list.find((m) => m.id === Number(matchId));
      return { rows: found ? [found] : [] };
    }

    if (lower.includes("is_kid_safe = true")) {
      list = list.filter((m) => m.is_kid_safe);
    }
    if (params.length > 0 && typeof params[0] === "string" && (params[0] === "movie" || params[0] === "tv")) {
      list = list.filter((m) => m.type === params[0]);
    }
    // Genre filter
    for (const p of params) {
      if (typeof p === "string" && GENRES.includes(p)) {
        list = list.filter((m) => m.genres.includes(p));
      }
    }

    if (lower.includes("order by rating desc")) {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      list.sort((a, b) => a.id - b.id);
    }

    if (lower.includes("limit")) {
      const limitMatch = cleanSql.match(/limit\s+(\d+|\$\d+)/i);
      let limitVal = 24;
      if (limitMatch) {
        if (limitMatch[1].startsWith("$")) {
          const idx = parseInt(limitMatch[1].slice(1)) - 1;
          limitVal = Number(params[idx]) || 24;
        } else {
          limitVal = Number(limitMatch[1]);
        }
      }
      list = list.slice(0, limitVal);
    }

    return { rows: list };
  }

  // SELECT users by email
  if (lower.startsWith("select") && lower.includes("from users where email")) {
    const email = params[0];
    const user = state.users.find((u) => u.email === email);
    return { rows: user ? [user] : [] };
  }

  // SELECT users by id
  if (lower.startsWith("select") && lower.includes("from users where id")) {
    const id = params[0];
    const user = state.users.find((u) => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // INSERT INTO users
  if (lower.startsWith("insert into users")) {
    const id = crypto.randomUUID();
    const newUser = {
      id,
      name: params[0] || "User",
      email: params[1] || "",
      password_hash: params[2] || "",
      created_at: new Date().toISOString(),
    };
    state.users.push(newUser);
    return { rows: [newUser] };
  }

  // SELECT profiles by user_id
  if (lower.startsWith("select") && lower.includes("from profiles where user_id")) {
    const userId = params[0];
    const profiles = state.profiles.filter((p) => p.user_id === userId);
    return { rows: profiles };
  }

  // INSERT INTO profiles
  if (lower.startsWith("insert into profiles")) {
    const id = crypto.randomUUID();
    const newProfile = {
      id,
      user_id: params[0],
      name: params[1],
      is_kids: Boolean(params[2]),
      avatar_seed: params[3] || "default",
      created_at: new Date().toISOString(),
    };
    state.profiles.push(newProfile);
    return { rows: [newProfile] };
  }

  // SELECT my_list
  if (lower.includes("from my_list") && lower.startsWith("select")) {
    const profileId = params[0];
    const movieIds = state.my_list.filter((l) => l.profile_id === profileId).map((l) => l.movie_id);
    const movies = state.movies.filter((m) => movieIds.includes(m.id));
    return { rows: movies };
  }

  // INSERT INTO my_list
  if (lower.startsWith("insert into my_list")) {
    const item = {
      id: crypto.randomUUID(),
      profile_id: params[0],
      movie_id: Number(params[1]),
      added_at: new Date().toISOString(),
    };
    state.my_list.push(item);
    return { rows: [item] };
  }

  // DELETE FROM my_list
  if (lower.startsWith("delete from my_list")) {
    state.my_list = state.my_list.filter((l) => !(l.profile_id === params[0] && l.movie_id === Number(params[1])));
    return { rows: [] };
  }

  // Default fallback
  return { rows: [] };
}

async function connect() {
  return {
    query: (sql, params) => query(sql, params),
    release: () => {},
  };
}

function end() {
  return Promise.resolve();
}

module.exports = {
  query,
  connect,
  end,
};
