# KnowNote + Claude Code Setup

This project integrates the `last30days` skill for research and content discovery.

## Skills

- **last30days** — Research what people actually say about any topic in the last 30 days. Pulls posts and engagement from Reddit, X, YouTube, TikTok, Hacker News, Polymarket, GitHub, and the web.

## Using the Skill

Once set up, you can invoke the skill with:

```
/last30days <topic>
```

Examples:
- `/last30days KnowNote usage trends`
- `/last30days AI note-taking tools`
- `/last30days what's new in Electron`

## First Run Setup

The skill includes an interactive setup wizard that runs on first invocation. Follow the prompts to:
- Configure API keys and authentication (optional)
- Select which sources to enable
- Authorize access to social media platforms (if desired)

For more information, see `skills/last30days/SKILL.md`.
