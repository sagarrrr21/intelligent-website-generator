"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const openai_1 = __importDefault(require("openai"));
const express_1 = __importDefault(require("express"));
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
const API_KEY = process.env.API_KEY;
const client = new openai_1.default({
    apiKey: API_KEY,
    baseURL: "https://api.perplexity.ai",
});
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/template", async (req, res) => {
    var _a;
    const prompt = req.body.prompt;
    const response = await client.chat.completions.create({
        model: "sonar-pro",
        messages: [
            {
                role: "system",
                content: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        max_tokens: 200,
    });
    const answer = (_a = response.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.trim();
    if (answer === "react") {
        res.json({
            prompts: [
                prompts_1.BASE_PROMPT,
                `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
            ],
            uiPrompts: [react_1.basePrompt],
        });
        return;
    }
    if (answer === "node") {
        res.json({
            prompts: [
                `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
            ],
            uiPrompts: [node_1.basePrompt],
        });
        return;
    }
    res.status(403).json({ message: "You can't access this" });
    return;
});
app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    const response = await client.chat.completions.create({
        messages: [{ role: "system", content: (0, prompts_1.getSystemPrompt)() }, ...messages],
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
