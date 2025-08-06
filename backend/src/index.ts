require("dotenv").config();
import OpenAI from "openai";
import express from "express";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";

const API_KEY = process.env.API_KEY;

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.perplexity.ai",
});

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt;

  const response = await client.chat.completions.create({
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content:
          "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 200,
  });

  const answer = response.choices[0].message.content?.trim();

  if (answer === "react") {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [reactBasePrompt],
    });
    return;
  }
  if (answer === "node") {
    res.json({
      prompts: [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [nodeBasePrompt],
    });
    return;
  }

  res.status(403).json({ message: "You can't access this" });

  return;
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;
  const response = await client.chat.completions.create({
    messages: [{ role: "system", content: getSystemPrompt() }, ...messages],

    model: "sonar-pro",
    max_tokens: 8000,
  });

  console.log(response);

  res.json({
    // response: response.choices[0].message.content?.trim(),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
