import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import dedent from "dedent";
import type { VFileCompatible, VFile } from "vfile";

import { describe, it, expect } from "vitest";

import plugin, { FlexibleTocOptions, TocItem } from "../src";
import { formatTocAsTable } from "./util/format";

const compilerCreator = (options?: FlexibleTocOptions) =>
  unified()
    .use(remarkParse)
    .use(gfm)
    .use(plugin, options)
    .use(remarkRehype)
    .use(rehypeStringify);

const process = async (
  content: VFileCompatible,
  options?: FlexibleTocOptions,
): Promise<VFile> => {
  return compilerCreator(options).process(content);
};

const source = dedent`
  # The Main Heading

  ## Section _1_

  ### Subheading

  ### Mubheading

  ## Section _2_

  ### \`Subheading\`

  ### [Mubheading](#)

  > #### QuoteHeading
  > Some Content
  > #### **QuoteHeading**
  > Some Content

  + ##### **ListItem** _Heading_
  + ##### _ListItem_ **Heading**
`;

describe("remark-flexible-toc", () => {
  // ******************************************
  it("with no options", async () => {
    const toc: TocItem[] = [];

    await process(source, { tocRef: toc });

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 4		1.2.2.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.2.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.2.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.2.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with tocName", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, tocName: "headings" }; // tocName does not affects the reference

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
          [
            " 2		1.1.      		root      		Section 1       		#section-1          ",
            " 3		1.1.1.    		root      		Subheading      		#subheading         ",
            " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
            " 2		1.2.      		root      		Section 2       		#section-2          ",
            " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
            " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
            " 4		1.2.2.1.  		blockquote		QuoteHeading    		#quoteheading       ",
            " 4		1.2.2.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
            " 5		1.2.2.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
            " 5		1.2.2.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
          ]
        `);
  });

  // ******************************************
  it("with maxDepth", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, maxDepth: 3 };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.  		root		Section 1 		#section-1    ",
        " 3		1.1.1.		root		Subheading		#subheading   ",
        " 3		1.1.2.		root		Mubheading		#mubheading   ",
        " 2		1.2.  		root		Section 2 		#section-2    ",
        " 3		1.2.1.		root		Subheading		#subheading-1 ",
        " 3		1.2.2.		root		Mubheading		#mubheading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with skipLevels", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, skipLevels: [1, 2], maxDepth: 3 };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 3		1.1.1.		root		Subheading		#subheading   ",
        " 3		1.1.2.		root		Mubheading		#mubheading   ",
        " 3		1.1.3.		root		Subheading		#subheading-1 ",
        " 3		1.1.4.		root		Mubheading		#mubheading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with skipParents", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = {
      tocRef: toc,
      skipParents: ["blockquote", "listItem"],
    };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.  		root		Section 1 		#section-1    ",
        " 3		1.1.1.		root		Subheading		#subheading   ",
        " 3		1.1.2.		root		Mubheading		#mubheading   ",
        " 2		1.2.  		root		Section 2 		#section-2    ",
        " 3		1.2.1.		root		Subheading		#subheading-1 ",
        " 3		1.2.2.		root		Mubheading		#mubheading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with exclude, case insensitive", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, exclude: ["mubheading"] };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 4		1.2.1.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.1.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.1.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.1.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with exclude but not matched", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, exclude: ["Section"] };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 4		1.2.2.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.2.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.2.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.2.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with prefix", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc, prefix: "prefix-" };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#prefix-section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#prefix-subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#prefix-mubheading         ",
        " 2		1.2.      		root      		Section 2       		#prefix-section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#prefix-subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#prefix-mubheading-1       ",
        " 4		1.2.2.1.  		blockquote		QuoteHeading    		#prefix-quoteheading       ",
        " 4		1.2.2.2.  		blockquote		QuoteHeading    		#prefix-quoteheading-1     ",
        " 5		1.2.2.2.1.		listItem  		ListItem Heading		#prefix-listitem-heading   ",
        " 5		1.2.2.2.2.		listItem  		ListItem Heading		#prefix-listitem-heading-1 ",
      ]
    `);
  });

  it("with calback", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = {
      tocRef: toc,
      callback: (toc) => {
        toc.length = 0; // interesting :)
      },
    };

    await process(source, options);

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`[]`);
  });

  it("both method creates the same output", async () => {
    const toc: TocItem[] = [];
    const options: FlexibleTocOptions = { tocRef: toc };

    const vfile = await process(source, options);
    const toc2 = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toEqual(formatTocAsTable(toc2));
  });
});
