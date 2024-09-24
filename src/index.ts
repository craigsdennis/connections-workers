import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

const TODAYS_CATEGORIES = [
  {
    name: "Things that went GA",
    difficulty: 1,
    values: ["Queues", "Vectorize", "Stun Server", "Gradual Rollouts"],
  },
  {
    name: "New Features used to build this actual Worker!",
    difficulty: 2,
    values: ["ASSETS", "Git Builds", "Logs", "Preview URLs"],
  },
  {
    name: "AI Task types hosted on Workers AI",
    difficulty: 3,
    values: ["Image-To-Text", "Text-To-Image", "Translation", "Automatic Speech Recognition"],
  },
  {
    name: "Things that are FREE!",
    difficulty: 4,
    values: ["API Shield", "Page Shield", "Security Anayltics", "Images"],
  },
];

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/games/today", async (c) => {
  const categoryValues = TODAYS_CATEGORIES.map((category) => category.values)
    .flat()
    .sort();
  return c.json({
    tiles: categoryValues,
  });
});

interface Counter {
  [key: string]: {
    count: number;
    category: string;
    difficulty: number;
    values: Array<string>;
  };
}

interface AttemptResponse {
  success: boolean;
  message?: string;
  category?: string;
  difficulty?: number;
  values?: Array<string>;
}

app.post("/api/games/today/attempt", async (c) => {
  // Parse the body
  const payload = await c.req.json();
  console.log("Attempt being made", payload);
  // Ensure there are 4 only
  const attempt = new Set(payload.values);
  if (attempt.size !== 4) {
    console.error(`Attempt was only ${attempt.size} unique values`);
    // TODO: Throw or return ?
    return c.json({ success: false, message: "You must choose four values" });
  }
  // Check cookie for mistakesRemainig

  const matchCountByCategory = TODAYS_CATEGORIES.reduce((counter, grouping) => {
    const wanted = new Set(grouping.values);
    counter[grouping.name] = {
      count: wanted.intersection(attempt).size,
      difficulty: grouping.difficulty,
      category: grouping.name,
      values: grouping.values,
    };
    return counter;
  }, {} as Counter);

  let response: AttemptResponse | undefined = undefined;

  for (const [categoryName, result] of Object.entries(matchCountByCategory)) {
    if (result.count === 4) {
      response = {
        success: true,
        category: result.category,
        difficulty: result.difficulty,
        values: result.values,
      };
      break;
    } else if (result.count === 3) {
      // Send almost if close [purposeful error]
      response = {
        success: false,
        message: `One away...`,
      };
      break;
    }
  }
  if (response === undefined) {
    response = { success: false, message: "Nope that's not it. You got this!" };
  }
  return c.json(response);
});

export default app;
