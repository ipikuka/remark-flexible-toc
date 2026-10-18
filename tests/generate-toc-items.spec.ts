import { describe, it, expect } from "vitest";
import type { Root } from "mdast";

import { generateTocItemsFromMdast } from "../src/index.js";

describe("generateTocItemsFromMdast", () => {
  // ******************************************
  it("generates toc items from headings at every level and different parents", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Level 1" }],
        },
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Level 2" }],
        },
        {
          type: "blockquote",
          children: [
            {
              type: "heading",
              depth: 3,
              children: [{ type: "text", value: "Level 3 Blockquote" }],
            },
          ],
        },
        {
          type: "list",
          ordered: false,
          spread: false,
          children: [
            {
              type: "listItem",
              spread: false,
              children: [
                {
                  type: "heading",
                  depth: 4,
                  children: [{ type: "text", value: "Level 4 List Item" }],
                },
              ],
            },
          ],
        },
        {
          type: "footnoteDefinition",
          identifier: "footnote",
          label: "footnote",
          children: [
            {
              type: "heading",
              depth: 5,
              children: [{ type: "text", value: "Level 5 Footnote" }],
            },
          ],
        },
        {
          type: "container",
          children: [
            {
              type: "heading",
              depth: 6,
              children: [{ type: "text", value: "Level 6 Container" }],
            },
          ],
        },
        {
          type: "mdxJsxFlowElement",
          name: "Component",
          attributes: [],
          children: [
            {
              type: "heading",
              depth: 2,
              children: [{ type: "text", value: "Level 2 MDX" }],
            },
          ],
        },
      ],
    } as Root;

    expect(
      generateTocItemsFromMdast(tree, {
        skipLevels: [],
      }),
    ).toEqual([
      {
        value: "Level 1",
        href: "#level-1",
        depth: 1,
        numbering: [1],
        parent: "root",
      },
      {
        value: "Level 2",
        href: "#level-2",
        depth: 2,
        numbering: [1, 1],
        parent: "root",
      },
      {
        value: "Level 3 Blockquote",
        href: "#level-3-blockquote",
        depth: 3,
        numbering: [1, 1, 1],
        parent: "blockquote",
      },
      {
        value: "Level 4 List Item",
        href: "#level-4-list-item",
        depth: 4,
        numbering: [1, 1, 1, 1],
        parent: "listItem",
      },
      {
        value: "Level 5 Footnote",
        href: "#level-5-footnote",
        depth: 5,
        numbering: [1, 1, 1, 1, 1],
        parent: "footnoteDefinition",
      },
      {
        value: "Level 6 Container",
        href: "#level-6-container",
        depth: 6,
        numbering: [1, 1, 1, 1, 1, 1],
        parent: "container",
      },
      {
        value: "Level 2 MDX",
        href: "#level-2-mdx",
        depth: 2,
        numbering: [1, 2],
        parent: "mdxJsxFlowElement",
      },
    ]);
  });

  // ******************************************
  it("uses the same default options as the remark plugin", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "heading",
          depth: 1,
          children: [{ type: "text", value: "Article Title" }],
        },
        {
          type: "heading",
          depth: 2,
          children: [{ type: "text", value: "Section" }],
        },
        {
          type: "heading",
          depth: 3,
          children: [{ type: "text", value: "Subsection" }],
        },
      ],
    } as Root;

    expect(generateTocItemsFromMdast(tree)).toEqual([
      {
        value: "Section",
        href: "#section",
        depth: 2,
        numbering: [1, 1],
        parent: "root",
      },
      {
        value: "Subsection",
        href: "#subsection",
        depth: 3,
        numbering: [1, 1, 1],
        parent: "root",
      },
    ]);
  });
});
