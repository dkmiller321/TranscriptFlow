# Figma Design Knowledge for Claude Code

Give Claude Code access to Figma's comprehensive design resource library - 200+ articles on UI/UX, color theory, typography, web design, and more.

## Quick Start

### 1. Scrape the Articles

```bash
cd figma-design-knowledge
bun run scrape
```

This downloads 65+ curated high-value articles as markdown files into `./articles/`.

### 2. Add to Claude Code as a Skill

**Option A: Copy to your project**
```bash
# Copy to your project's docs
cp -r figma-design-knowledge /path/to/your/project/docs/design-knowledge
```

Then reference in your `CLAUDE.md`:
```markdown
## Design Knowledge
When building UI components, reference `/docs/design-knowledge/SKILL.md` for:
- Color theory and palettes
- Typography best practices  
- Layout and spacing systems
- Accessibility guidelines
- Component patterns
```

**Option B: Add as a global Claude Code skill**
```bash
# Add to Claude Code's skills directory (if you have one configured)
cp -r figma-design-knowledge ~/.claude/skills/figma-design/
```

### 3. Reference in Conversations

Once set up, you can ask Claude Code things like:
- "Using the design skill, what color palette would work for a finance dashboard?"
- "Check the design docs - what's the recommended button sizing?"
- "Reference the typography guide for this landing page"

## What's Included

### SKILL.md (Condensed Reference)
Quick-reference guide with:
- Visual hierarchy principles
- Color usage (60-30-10 rule)
- Typography scales and pairing
- 8px spacing system
- Component guidelines (buttons, forms, cards, nav)
- Responsive breakpoints
- Accessibility checklist
- Design token structure

### Articles (Deep Dives)
65+ markdown files covering:

| Category | Topics |
|----------|--------|
| UI/UX Principles | Design thinking, Gestalt, Fitts's Law, accessibility |
| Prototyping | Wireframes, mockups, user flows, MVPs |
| Web Design | Responsive, mobile-first, layouts, navigation |
| Color Theory | Palettes, combinations, RGB/CMYK, symbolism |
| Typography | Font pairing, anatomy, kerning, web fonts |
| Brand | Logos, style guides, storytelling |
| Research | UX methods, storyboards, design research |

## Expanding Coverage

The scraper includes 65 curated articles. To add more:

1. Find article URLs at https://www.figma.com/resource-library/
2. Add URLs to the `FIGMA_ARTICLES` array in `scrape-figma.ts`
3. Re-run `bun run scrape`

## Evolving to an MCP Server

If you find yourself referencing this frequently, consider building an MCP server:

```typescript
// Pseudocode for future MCP server
const server = new MCPServer({
  name: "figma-design",
  tools: [{
    name: "search_design_knowledge",
    description: "Search Figma design articles",
    handler: async ({ query }) => {
      // Semantic search over articles
      return searchArticles(query);
    }
  }]
});
```

This would enable on-demand queries rather than loading all content upfront.

## License

Articles are from Figma's public resource library. Use for personal/development reference only.
