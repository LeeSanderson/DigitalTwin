# Digital Twin

This project is based on the exercise from day four of Ed Donner's course, [*AI Coder: Vibe Coder to Agentic Engineer in Three Weeks*](https://www.udemy.com/course/ai-coder-from-vibe-coder-to-agentic-engineer).

It is a Vibe Coding exercise that uses OpenRouter to create a "Digital Twin" from my Linked-In profile.

## Environment setup

Before running the project, create a local `.env` file from `.env.example`.

```bash
cp .env.example .env
```

If you are using PowerShell on Windows, you can use:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and replace the placeholder value with your real OpenRouter API key:

```env
OPENROUTER_API_KEY=your-real-openrouter-api-key
```

The `.env.example` file shows the required variable name, and `.env` is ignored by git so your secret key is not committed.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
