import { describe, it, expect } from "vitest";
import type { Emphasis, Heading, PhrasingContent, Root, Text } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import dedent from "dedent";

import { process } from "./util/index.js";
import { generateTocItemsFromMdast, type TocItem } from "../src/index.js";

describe("generateTocItemsFromMdast new options", () => {
  // ******************************************
  it("provides normalized rich content without mutating the MDAST heading", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 2,
          position: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 65, offset: 64 },
          },
          children: [
            {
              type: "text",
              value: "Using ",
              position: {
                start: { line: 1, column: 4, offset: 3 },
                end: { line: 1, column: 10, offset: 9 },
              },
            },
            {
              type: "emphasis",
              position: {
                start: { line: 1, column: 10, offset: 9 },
                end: { line: 1, column: 19, offset: 18 },
              },
              children: [
                {
                  type: "text",
                  value: "Lexical",
                  position: {
                    start: { line: 1, column: 11, offset: 10 },
                    end: { line: 1, column: 18, offset: 17 },
                  },
                },
              ],
            },
            { type: "text", value: " with " },
            { type: "inlineCode", value: "MDX" },
            {
              type: "highlight",
              children: [{ type: "text", value: " highlighted" }],
            } as unknown as PhrasingContent,
            { type: "text", value: " and " },
            {
              type: "link",
              url: "https://example.com",
              title: null,
              children: [{ type: "text", value: "the docs" }],
            },
            { type: "text", value: " or " },
            {
              type: "linkReference",
              identifier: "reference",
              label: "reference",
              referenceType: "full",
              children: [{ type: "text", value: "reference" }],
            },
            { type: "text", value: " " },
            { type: "footnoteReference", identifier: "note", label: "note" },
          ],
        },
      ],
    } as Root;

    const toc = generateTocItemsFromMdast(tree);

    expect(toc[0]?.content).toEqual([
      { type: "text", value: "Using " },
      {
        type: "emphasis",
        children: [{ type: "text", value: "Lexical" }],
      },
      { type: "text", value: " with " },
      { type: "inlineCode", value: "MDX" },
      {
        type: "highlight",
        children: [{ type: "text", value: " highlighted" }],
      },
      { type: "text", value: " and " },
      { type: "text", value: "the docs" },
      { type: "text", value: " or " },
      { type: "text", value: "reference" },
      { type: "text", value: " " },
    ]);

    const contentEmphasis = toc[0]?.content[1] as Emphasis;
    const contentText = contentEmphasis.children[0] as Text;
    contentText.value = "Changed";

    const heading = tree.children[0] as Heading;
    const headingEmphasis = heading.children[1] as Emphasis;
    const headingText = headingEmphasis.children[0] as Text;

    expect(headingText.value).toBe("Lexical");
    expect(heading.position).toBeDefined();
  });

  // ******************************************
  it("generates toc items after the first matching heading section", () => {
    const source = dedent`
      ## API

      ## Contents

      ### Old generated section heading

      ## API

      ### Usage
    `;

    const toc = generateTocItemsFromMdast(fromMarkdown(source), {
      after: "contents",
      skipLevels: [],
    });

    expect(
      toc.map(({ value, href, depth, numbering }) => ({ value, href, depth, numbering })),
    ).toEqual([
      {
        value: "API",
        href: "#api-1",
        depth: 2,
        numbering: [1, 1],
      },
      {
        value: "Usage",
        href: "#usage",
        depth: 3,
        numbering: [1, 1, 1],
      },
    ]);
  });

  // ******************************************
  it("returns an empty toc if after does not match a heading", () => {
    const source = dedent`
      ## Section

      ### Subsection
    `;

    expect(
      generateTocItemsFromMdast(fromMarkdown(source), {
        after: "contents",
      }),
    ).toEqual([]);
  });

  // ******************************************
  it("keeps custom heading ids and prefix behavior after the matching section", async () => {
    const source = dedent`
      ## Contents

      ## Section {#custom-section}

      ### Subsection
    `;

    const toc: TocItem[] = [];
    await process(source, {
      tocRef: toc,
      after: "contents",
      prefix: "prefix-",
    });

    expect(toc.map(({ value, href }) => ({ value, href }))).toEqual([
      { value: "Section", href: "#custom-section" },
      { value: "Subsection", href: "#prefix-subsection" },
    ]);
  });

  // ******************************************
  it("allows parent types with includeParents", () => {
    const source = dedent`
      ## Root Heading

      > ## Blockquote Heading

      - ## List Item Heading
    `;

    const toc = generateTocItemsFromMdast(fromMarkdown(source), {
      skipLevels: [],
      includeParents: ["root", "blockquote"],
    });

    expect(toc.map(({ value }) => value)).toEqual(["Root Heading", "Blockquote Heading"]);
  });

  // ******************************************
  it("skipParents excludes from includeParents and wins on overlap", () => {
    const source = dedent`
      ## Root Heading

      > ## Blockquote Heading

      - ## List Item Heading
    `;

    const toc = generateTocItemsFromMdast(fromMarkdown(source), {
      skipLevels: [],
      includeParents: ["root", "blockquote", "listItem"],
      skipParents: ["blockquote", "listItem"],
    });

    expect(toc.map(({ value }) => value)).toEqual(["Root Heading"]);
  });

  // ******************************************
  it("allows root to be skipped", () => {
    const source = dedent`
      ## Root Heading

      > ## Blockquote Heading

      - ## List Item Heading
    `;

    const toc = generateTocItemsFromMdast(fromMarkdown(source), {
      skipLevels: [],
      skipParents: "root",
    });

    expect(toc.map(({ value }) => value)).toEqual(["Blockquote Heading", "List Item Heading"]);
  });

  // ******************************************
  it("supports an is-compatible predicate for parent filters", () => {
    const source = dedent`
      ## Root Heading

      > ## Blockquote Heading

      - ## List Item Heading
    `;

    const toc = generateTocItemsFromMdast(fromMarkdown(source), {
      skipLevels: [],
      includeParents: (node) => node.type === "blockquote",
    });

    expect(toc.map(({ value }) => value)).toEqual(["Blockquote Heading"]);
  });

  // ******************************************
  it("generates the same toc items as the remark plugin with the new options", async () => {
    const source = dedent`
      ## Before

      ## Contents

      ### Old generated section heading

      ## Section

      > ### Blockquote Heading

      ### Subsection
    `;

    const options = {
      after: "contents",
      includeParents: ["root", "blockquote"],
      skipParents: "blockquote",
    } as const;

    const tree = fromMarkdown(source);
    const tocItems = generateTocItemsFromMdast(tree, options);

    const tocRef: TocItem[] = [];
    await process(source, { ...options, tocRef });

    expect(tocRef).toEqual(tocItems);
  });
});
