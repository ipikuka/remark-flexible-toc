import { describe, it, expect } from "vitest";
import dedent from "dedent";

import type { FlexibleTocOptions, TocItem } from "../src";
import { formatTocAsTable } from "./util/format";
import { process } from "./util/index";

const source = dedent`
  # The Main Heading

  ## Section _1_

  ### Subheading

  ### Mubheading

  ## Section _2_

  ### \`Subheading\`

  ### [Mubheading](#)

  ### Custom Heading {#custom-id}

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
    const vfile = await process(source);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 3		1.2.3.    		root      		Custom Heading  		#custom-id          ",
        " 4		1.2.3.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.3.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.3.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.3.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with empty options", async () => {
    const options: FlexibleTocOptions = {};

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 3		1.2.3.    		root      		Custom Heading  		#custom-id          ",
        " 4		1.2.3.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.3.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.3.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.3.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with tocName", async () => {
    const options: FlexibleTocOptions = { tocName: "headings" };

    const vfile = await process(source, options);
    const toc = vfile.data.headings as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 3		1.2.3.    		root      		Custom Heading  		#custom-id          ",
        " 4		1.2.3.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.3.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.3.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.3.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with maxDepth", async () => {
    const options: FlexibleTocOptions = { maxDepth: 3 };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.  		root		Section 1     		#section-1    ",
        " 3		1.1.1.		root		Subheading    		#subheading   ",
        " 3		1.1.2.		root		Mubheading    		#mubheading   ",
        " 2		1.2.  		root		Section 2     		#section-2    ",
        " 3		1.2.1.		root		Subheading    		#subheading-1 ",
        " 3		1.2.2.		root		Mubheading    		#mubheading-1 ",
        " 3		1.2.3.		root		Custom Heading		#custom-id    ",
      ]
    `);
  });

  // ******************************************
  it("with skipLevels", async () => {
    const options: FlexibleTocOptions = { skipLevels: [1, 2], maxDepth: 3 };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 3		1.1.1.		root		Subheading    		#subheading   ",
        " 3		1.1.2.		root		Mubheading    		#mubheading   ",
        " 3		1.1.3.		root		Subheading    		#subheading-1 ",
        " 3		1.1.4.		root		Mubheading    		#mubheading-1 ",
        " 3		1.1.5.		root		Custom Heading		#custom-id    ",
      ]
    `);
  });

  // ******************************************
  it("with skipParents", async () => {
    const options: FlexibleTocOptions = { skipParents: ["blockquote", "listItem"] };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.  		root		Section 1     		#section-1    ",
        " 3		1.1.1.		root		Subheading    		#subheading   ",
        " 3		1.1.2.		root		Mubheading    		#mubheading   ",
        " 2		1.2.  		root		Section 2     		#section-2    ",
        " 3		1.2.1.		root		Subheading    		#subheading-1 ",
        " 3		1.2.2.		root		Mubheading    		#mubheading-1 ",
        " 3		1.2.3.		root		Custom Heading		#custom-id    ",
      ]
    `);
  });

  // ******************************************
  it("with exclude, case insensitive", async () => {
    const options: FlexibleTocOptions = { exclude: ["mubheading"] };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Custom Heading  		#custom-id          ",
        " 4		1.2.2.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.2.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.2.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.2.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with exclude but not matched", async () => {
    const options: FlexibleTocOptions = { exclude: "Section" };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#mubheading         ",
        " 2		1.2.      		root      		Section 2       		#section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#mubheading-1       ",
        " 3		1.2.3.    		root      		Custom Heading  		#custom-id          ",
        " 4		1.2.3.1.  		blockquote		QuoteHeading    		#quoteheading       ",
        " 4		1.2.3.2.  		blockquote		QuoteHeading    		#quoteheading-1     ",
        " 5		1.2.3.2.1.		listItem  		ListItem Heading		#listitem-heading   ",
        " 5		1.2.3.2.2.		listItem  		ListItem Heading		#listitem-heading-1 ",
      ]
    `);
  });

  // ******************************************
  it("with prefix", async () => {
    const options: FlexibleTocOptions = { prefix: "prefix-" };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`
      [
        " 2		1.1.      		root      		Section 1       		#prefix-section-1          ",
        " 3		1.1.1.    		root      		Subheading      		#prefix-subheading         ",
        " 3		1.1.2.    		root      		Mubheading      		#prefix-mubheading         ",
        " 2		1.2.      		root      		Section 2       		#prefix-section-2          ",
        " 3		1.2.1.    		root      		Subheading      		#prefix-subheading-1       ",
        " 3		1.2.2.    		root      		Mubheading      		#prefix-mubheading-1       ",
        " 3		1.2.3.    		root      		Custom Heading  		#custom-id                 ",
        " 4		1.2.3.1.  		blockquote		QuoteHeading    		#prefix-quoteheading       ",
        " 4		1.2.3.2.  		blockquote		QuoteHeading    		#prefix-quoteheading-1     ",
        " 5		1.2.3.2.1.		listItem  		ListItem Heading		#prefix-listitem-heading   ",
        " 5		1.2.3.2.2.		listItem  		ListItem Heading		#prefix-listitem-heading-1 ",
      ]
    `);
  });

  it("with calback", async () => {
    const options: FlexibleTocOptions = {
      callback: (toc) => {
        toc.length = 0; // interesting :)
      },
    };

    const vfile = await process(source, options);
    const toc = vfile.data.toc as TocItem[];

    expect(formatTocAsTable(toc)).toMatchInlineSnapshot(`[]`);
  });
});
