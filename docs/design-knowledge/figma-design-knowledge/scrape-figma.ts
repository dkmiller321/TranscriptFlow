/**
 * Figma Resource Library Scraper
 * 
 * Pulls Figma's design knowledge articles via Jina Reader
 * and saves them as markdown for Claude Code to reference.
 * 
 * Usage: bun run scrape-figma.ts
 */

const FIGMA_ARTICLES = [
  // === UI/UX Design Principles (Core) ===
  "https://www.figma.com/resource-library/what-is-ux-design/",
  "https://www.figma.com/resource-library/what-is-ui-design/",
  "https://www.figma.com/resource-library/difference-between-ui-and-ux/",
  "https://www.figma.com/resource-library/ui-design-principles/",
  "https://www.figma.com/resource-library/what-is-design-thinking/",
  "https://www.figma.com/resource-library/what-is-graphic-design/",
  "https://www.figma.com/resource-library/design-system-examples/",
  "https://www.figma.com/resource-library/interaction-design/",
  "https://www.figma.com/resource-library/visual-hierarchy/",
  "https://www.figma.com/resource-library/gestalt-principles/",
  "https://www.figma.com/resource-library/human-centered-design/",
  "https://www.figma.com/resource-library/golden-ratio/",
  "https://www.figma.com/resource-library/fitts-law/",
  "https://www.figma.com/resource-library/creating-accessible-and-inclusive-design/",
  "https://www.figma.com/resource-library/consistency-in-design/",
  "https://www.figma.com/resource-library/simplicity-design-principles/",

  // === Prototyping & Wireframing ===
  "https://www.figma.com/resource-library/how-to-design-an-app/",
  "https://www.figma.com/resource-library/what-is-wireframing/",
  "https://www.figma.com/resource-library/wireframe-vs-mockup/",
  "https://www.figma.com/resource-library/what-is-prototyping/",
  "https://www.figma.com/resource-library/high-fidelity-prototyping/",
  "https://www.figma.com/resource-library/low-fidelity-prototyping/",
  "https://www.figma.com/resource-library/rapid-prototyping/",
  "https://www.figma.com/resource-library/user-flow/",
  "https://www.figma.com/resource-library/what-is-a-minimum-viable-product/",

  // === Web Design ===
  "https://www.figma.com/resource-library/what-is-web-design/",
  "https://www.figma.com/resource-library/responsive-website-design/",
  "https://www.figma.com/resource-library/mobile-first-design/",
  "https://www.figma.com/resource-library/mobile-website-design/",
  "https://www.figma.com/resource-library/website-structure/",
  "https://www.figma.com/resource-library/website-layout-ideas/",
  "https://www.figma.com/resource-library/web-design-grid-layout-examples/",
  "https://www.figma.com/resource-library/website-color-schemes/",
  "https://www.figma.com/resource-library/call-to-action-examples/",
  "https://www.figma.com/resource-library/hamburger-menu/",
  "https://www.figma.com/resource-library/one-page-website/",
  "https://www.figma.com/resource-library/portfolio-website-examples/",
  "https://www.figma.com/resource-library/how-to-use-ai-to-create-a-website/",

  // === Color Theory ===
  "https://www.figma.com/resource-library/color-combinations/",
  "https://www.figma.com/resource-library/what-is-color-theory/",
  "https://www.figma.com/resource-library/types-of-color-palettes/",
  "https://www.figma.com/resource-library/what-is-rgb/",
  "https://www.figma.com/resource-library/what-is-cmyk/",
  "https://www.figma.com/resource-library/what-are-primary-colors/",
  "https://www.figma.com/resource-library/what-are-secondary-colors/",
  "https://www.figma.com/resource-library/what-are-complementary-colors/",
  "https://www.figma.com/resource-library/what-are-triadic-colors/",
  "https://www.figma.com/resource-library/monochromatic-colors/",
  "https://www.figma.com/resource-library/color-symbolism/",

  // === Typography ===
  "https://www.figma.com/resource-library/typography-in-design/",
  "https://www.figma.com/resource-library/typography-anatomy/",
  "https://www.figma.com/resource-library/font-pairings/",
  "https://www.figma.com/resource-library/best-fonts-for-websites/",
  "https://www.figma.com/resource-library/best-serif-fonts/",
  "https://www.figma.com/resource-library/best-sans-serif-fonts/",
  "https://www.figma.com/resource-library/what-is-kerning/",
  "https://www.figma.com/resource-library/best-fonts-for-logos/",

  // === Brand & Storytelling ===
  "https://www.figma.com/resource-library/types-of-logos/",
  "https://www.figma.com/resource-library/how-to-design-a-logo/",
  "https://www.figma.com/resource-library/what-is-a-style-guide/",
  "https://www.figma.com/resource-library/storytelling-in-design/",
  "https://www.figma.com/resource-library/how-to-create-a-design-brief/",

  // === Research & Strategy ===
  "https://www.figma.com/resource-library/ux-design-research-methods/",
  "https://www.figma.com/resource-library/what-is-ux-strategy/",
  "https://www.figma.com/resource-library/what-is-design-research/",
  "https://www.figma.com/resource-library/how-to-create-a-ux-storyboard/",
  "https://www.figma.com/resource-library/content-research/",
];

const OUTPUT_DIR = "./articles";
const DELAY_MS = 1500; // Be respectful to Jina's servers

async function fetchArticle(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl, {
    headers: {
      "Accept": "text/markdown",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  
  return response.text();
}

function getFilename(url: string): string {
  const slug = url.split("/resource-library/")[1]?.replace(/\/$/, "") || "unknown";
  return `${slug}.md`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`📚 Figma Design Knowledge Scraper`);
  console.log(`   Fetching ${FIGMA_ARTICLES.length} articles...\n`);

  // Create output directory
  await Bun.write(`${OUTPUT_DIR}/.gitkeep`, "");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < FIGMA_ARTICLES.length; i++) {
    const url = FIGMA_ARTICLES[i];
    const filename = getFilename(url);
    
    process.stdout.write(`[${i + 1}/${FIGMA_ARTICLES.length}] ${filename}... `);
    
    try {
      const content = await fetchArticle(url);
      await Bun.write(`${OUTPUT_DIR}/${filename}`, content);
      console.log("✓");
      success++;
    } catch (error) {
      console.log(`✗ ${error}`);
      failed++;
    }
    
    // Rate limiting
    if (i < FIGMA_ARTICLES.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✅ Complete! ${success} saved, ${failed} failed`);
  console.log(`📁 Articles saved to: ${OUTPUT_DIR}/`);
}

main();
