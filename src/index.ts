import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

const TODAYS_CATEGORIES = [
  {
      name: 'Fruits',
      difficulty: 1,
      values: ['Apple', 'Banana', 'Cherry', 'Date']
  },
  {
      name: 'Animals',
      difficulty: 2,
      values: ['Elephant', 'Frog', 'Giraffe', 'Horse']
  },
  {
      name: 'Countries',
      difficulty: 3,
      values: ['India', 'Japan', 'Kenya', 'Libya']
  },
  {
      name: 'Subjects',
      difficulty: 4,
      values: ['Math', 'Physics', 'Chemistry', 'Biology']
  }
];

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/games/today", async(c) => {
  const categoryValues = TODAYS_CATEGORIES
    .map((category) => category.values)
    .flat()
    .sort();
  return c.json({
    categories: categoryValues
  });
});

interface Counter {
  [key: string]: {
    count: number,
    category: string,
    difficulty: number,
    values: Array<string>
  }
}

interface AttemptResponse {
  success: boolean,
  message?: string,
  category?: string,
  difficulty?: number,
  values?: Array<string>
}

app.post("/api/games/today/attempt", async(c) => {
  // Check cookie for numAttempts 
    // Set to 1 if not
  // Parse the body
  const payload = await c.req.json();
  // Ensure there are 4 only
  const attempt = new Set(payload);
  if (attempt.size !== 4) {
    console.error(`Attempt was only ${attempt.size} unique values`);
    // TODO: Throw or return ?
    throw new Error(`You must choose four values`);
  }

  const matchCountByCategory = TODAYS_CATEGORIES.reduce((counter, grouping) => {
    const wanted = new Set(grouping.values);
    counter[grouping.name] = {
      count: wanted.intersection(attempt).size,
      difficulty: grouping.difficulty,
      category: grouping.name,
      values: grouping.values,
    }
    return counter;
  }, {} as Counter);

  let response: AttemptResponse | undefined = undefined;

  for (const [categoryName, result] of Object.entries(matchCountByCategory)) {
    if (result.count === 4) {
      response = {
        success: true,
        category: result.category,
        difficulty: result.difficulty,
        values: result.values
      }
      break;
    } else if (result.count === 3) {
      // Send almost if close [purposeful error]
      response = {
        success: false,
        message: `Super close you have ${result.count} correct. Keep trying!`
      }
      break;
    }
  }
  if (response === undefined) {
    response = {success: false}
  }
  return c.json(response);
});

export default app;
