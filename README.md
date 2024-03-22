# remark-flexible-toc

[![NPM version][npm-image]][npm-url]
[![Build][github-build]][github-build-url]
![npm-typescript]
[![License][github-license]][github-license-url]
[![codecov](https://codecov.io/gh/ipikuka/remark-flexible-toc/graph/badge.svg?token=QBNX6L8W2G)](https://codecov.io/gh/ipikuka/remark-flexible-toc)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fipikuka%2Fremark-flexible-toc%2Fmaster%2Fpackage.json)](https://github.com/ipikuka/remark-flexible-toc)

This package is a [unified][unified] ([remark][remark]) plugin to expose the table of contents via Vfile.data or via an option reference (compatible with new parser "[micromark][micromark]").

"**unified**" is a project that transforms content with abstract syntax trees (ASTs). "**remark**" adds support for markdown to unified. "**mdast**" is the markdown abstract syntax tree (AST) that remark uses.

**This plugin is a remark plugin that gets info from the mdast.**

## When should I use this?

This plugin `remark-flexible-toc` is useful if you want to get the table of contents (TOC) from the markdown/MDX document. The `remark-flexible-toc` exposes the table of contents (TOC) in two ways:
+ by adding the `toc` into the Vfile.data
+ by mutating an array of reference if provided in the options

## Installation

This package is suitable for ESM only. In Node.js (version 16+), install with npm:

```bash
npm install remark-flexible-toc
```

or

```bash
yarn add remark-flexible-toc
```

## Usage

Say we have the following file, `example.md`, which consists some headings.

```markdown
# The Main Heading

## Section

### Subheading 1

### Subheading 2
```

And our module, `example.js`, looks as follows:

```javascript
import { read } from "to-vfile";
import remark from "remark";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFlexibleToc from "remark-flexible-toc";

main();

async function main() {
  const toc = [];

  const file = await remark()
    .use(gfm)
    .use(remarkFlexibleToc, {tocRef: toc})
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(await read("example.md"));

  // the first way of getting the table of contents (TOC) via file.data
  console.log(file.data.toc);

  // the second way of getting the table of contents (TOC), since we provided an array of reference in the options
  console.log(toc);
}
```

Now, running `node example.js` you see that the same table of contents is logged in the console:

```javascript
[
  {
    depth: 2,
    href: "#section",
    numbering: [1, 1],
    parent: "root",
    value: "Section",
  },
  {
    depth: 3,
    href: "#subheading-1",
    numbering: [1, 1, 1],
    parent: "root",
    value: "Subheading 1",
  },
  {
    depth: 3,
    href: "#subheading-2",
    numbering: [1, 1, 2],
    parent: "root",
    value: "Subheading 2",
  },
]
```

Without `remark-flexible-toc`, there wouldn't be any `toc` key in the `file.data`:

## Options

All options are **optional**.

```typescript
type HeadingParent =
  | "root"
  | "blockquote"
  | "footnoteDefinition"
  | "listItem"
  | "container"
  | "mdxJsxFlowElement";

type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

use(remarkFlexibleToc, {
  tocName?: string; // default: "toc"
  tocRef?: TocItem[]; // default: []
  maxDepth?: HeadingDepth; // default: 6
  skipLevels?: HeadingDepth[]; // default: [1]
  skipParents?: Exclude<HeadingParent, "root">[]; // default: []
  exclude?: string | string[]; // default is undefined
  prefix?: string; // default is undefined
  fallback?: (toc: TocItem[]) => undefined; // default is undefined
} as FlexibleTocOptions);
```

#### `tocName`

It is a **string** option in which the table of contents (TOC) is placed in the `vfile.data`. 

By default it is **`toc`**, meaningly the TOC is reachable via `vfile.data.toc`.

```javascript
use(remarkFlexibleToc, {
  tocName: "headings";
});
```
Now, the TOC is accessable via `vfile.data.headings`.

#### `tocRef`

It is an **array of reference** option for getting the table of contents (TOC), which is the second way of getting the TOC from the `remark-flexible-toc`.

The reference array should be an empty array, if not, it is emptied by the plugin.

If you use _typescript_, the array reference should be `const toc: TocItem[] = []`.

```javascript
const toc = [];

use(remarkFlexibleToc, {
  tocRef: toc; // the `remark-flexible-toc` mutates the array of reference
});
```

Now, the TOC is accessable via `toc`.

#### `maxDepth`

It is a **number** option for indicating the max heading depth to include in the TOC.

By default it is `6`. Meaningly, there is no restriction by default.

```javascript
use(remarkFlexibleToc, {
  maxDepth: 4;
});
```

The `maxDepth` option is inclusive: when set to 4, level fourth headings are included, but fifth and sixth level headings will be skipped.

#### `skipLevels` 

It is an **array** option to indicate the heading levels to be skipped. 

By default it is `[1]` since the first level heading is not expected to be in the TOC.

```javascript
use(remarkFlexibleToc, {
  skipLevels: [1, 2, 4, 5, 6];
});
```

Now, the TOC consists only the third level headings.

#### `skipParents`

By default it is an empty array `[]`. The array may contain the parent values `blockquote`, `footnoteDefinition`, `listItem`, `container`, `mdxJsxFlowElement`.

```javascript
use(remarkFlexibleToc, {
  skipParents: ["blockquote"];
});
```

Now, the headings in the `<blockquote>` will not be added into the TOC.

#### `exclude`

It is a **string** or **string[]** option. The plugin wraps the string(s) in new RegExp('^(' + value + ')$', 'i'), so any heading matching this expression will not be present in the TOC. The RegExp checks exact (not contain) matching and case insensitive as you see.

The option has no default value.

```javascript
use(remarkFlexibleToc, {
  exclude: "The Subheading";
});
```
Now, the heading "The Subheading" will not be included in to the TOC, but forexample "The Subheading Something" will be included.

#### `prefix`

It is a **string** option to add a prefix to `href`s of the TOC items. It is useful for example when later going from markdown to HTML and sanitizing with `rehype-sanitize`.

The option has no default value.

```javascript
use(remarkFlexibleToc, {
  prefix: "text-prefix-";
});
```
Now, all TOC items' `href`s will start with that prefix like `#text-prefix-the-subheading`.

#### `callback`

It is a **callback function** `callback?: (toc: TocItem[]) => undefined;` which takes the TOC items as an argument and returns nothing. It is usefull for logging the TOC, forexample, or modifing the TOC. **It is allowed that the callback function is able to mutate the TOC items !**

The option has no default value.

```javascript
use(remarkFlexibleToc, {
  callback: (toc) => {
    console.log(toc);
  };
});
```

Now, each time when you compile the source, the TOC will be logged into the console for debugging purpose.

## A Table of Content (TOC) Item

```typescript
type TocItem = {
  value: string; // heading text
  href: string; // produced uniquely by "github-slugger" using the value of the heading
  depth: HeadingDepth; // 1 | 2 | 3 | 4 | 5 | 6
  numbering: number[]; // explained below
  parent: HeadingParent; // "root"| "blockquote" | "footnoteDefinition" | "listItem" | "container" | "mdxJsxFlowElement"
  data?: Record<string, unknown>; // Other remark plugins can store custom data in "node.data.hProperties" like "id" etc.
};
```

As a note, the `remark-flexible-toc` uses the `github-slugger` internally for producing unique links. Then, it is possible you to use [`rehype-slug`](https://github.com/rehypejs/rehype-slug) (forIDs on headings) and [`rehype-autolink-headings`](https://github.com/rehypejs/rehype-autolink-headings) (for anchors that link-to-self) because they use the same `github-slugger`.

As an example for the unique heading links (notice the same heading texts).

```markdown
# The Main Heading

## Section

### Subheading

## Section
      
### Subheading
```

The `github-slugger` produces unique links with using a counter mechanism internally, and the TOC item's `href`s is going to be unique.

```javascript
[
  {
    depth: 2,
    href: "#section",
    numbering: [1, 1],
    parent: "root",
    value: "Section",
  },
  {
    depth: 3,
    href: "#subheading",
    numbering: [1, 1, 1],
    parent: "root",
    value: "Subheading",
  },
  {
    depth: 2,
    href: "#section-1",
    numbering: [1, 2],
    parent: "root",
    value: "Section",
  },
  {
    depth: 3,
    href: "#subheading-1",
    numbering: [1, 2, 1],
    parent: "root",
    value: "Subheading",
  },
]
```

## Numbering for Ordered Table of Contents

The `remark-flexible-toc` produces always the `numbering` for the TOC items in case you show the ordered TOC.

The **numbering** of a TOC item is an array of number. The numbers in the `numbering` corresponds the **level of the headers**. With that structure, you know which header is under which header.

```js
[1, 1]
[1, 2]
[1, 2, 1]
[1, 2, 2]
[1, 3]
```

The first number of the `numbering` is related with the fist level headings.
The second number of the `numbering` is related with the second level headings.
And so on...

If yo haven't included the first level header into the TOC, you can slice the `numbering` with `1` so as to second level headings starts with `1` and so on..

```javascript
tocItem.numbering.slice(1);
```

You can join the `numbering` as you wish. It is up to you to combine the `numbering` with dot, or dash.

```javascript
tocItem.numbering.join(".");
tocItem.numbering.join("-");
```

## Syntax tree

This plugin does not modify the `mdast` (markdown abstract syntax tree), collects data from the `mdast` and adds information into the `vfile.data` if required.

## Types

This package is fully typed with [TypeScript][typeScript].

The plugin exports the types `FlexibleTocOptions`, `HeadingParent`, `HeadingDepth`, `TocItem`.

## Compatibility

This plugin works with unified version 6+ and remark version 7+. It is compatible with MDX version 3.

## Security

Use of `remark-flexible-toc` does not involve rehype (hast) or user content so there are no openings for cross-site scripting (XSS) attacks.

## My Plugins

### My Remark Plugins

+ [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
+ [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
+ [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown
+ [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
+ [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
+ [`remark-flexible-toc`](https://www.npmjs.com/package/remark-flexible-toc)
  – Remark plugin to expose the table of contents via Vfile.data or via an option reference

### My Recma Plugins

+ [`recma-mdx-escape-missing-components`](https://www.npmjs.com/package/recma-mdx-escape-missing-components)
  – Recma plugin to set the default value `() => null` for the Components in MDX in case of missing or not provided
+ [`recma-mdx-change-props`](https://www.npmjs.com/package/recma-mdx-change-props)
  – Recma plugin to change the 'props' parameter into '_props' in the function '_createMdxContent' in the compiled source in order to be able to use {props.foo} like expressions. It is useful for the `next-mdx-remote` or `next-mdx-remote-client` users in `nextjs` applications.

## License

[MIT][license] © ipikuka

### Keywords

[unified][unifiednpm] [remark][remarknpm] [remark-plugin][remarkpluginnpm] [mdast][mdastnpm] [markdown][markdownnpm] [mdx][mdxnpm] [remark toc][remarktocnpm] [remark table of contents][remarktableofcontentsnpm]

[unified]: https://github.com/unifiedjs/unified
[unifiednpm]: https://www.npmjs.com/search?q=keywords:unified
[remark]: https://github.com/remarkjs/remark
[remarknpm]: https://www.npmjs.com/search?q=keywords:remark
[remarkpluginnpm]: https://www.npmjs.com/search?q=keywords:remark%20plugin
[mdast]: https://github.com/syntax-tree/mdast
[mdastnpm]: https://www.npmjs.com/search?q=keywords:mdast
[micromark]: https://github.com/micromark/micromark
[typescript]: https://www.typescriptlang.org/
[license]: https://github.com/ipikuka/remark-flexible-toc/blob/main/LICENSE
[mdxnpm]: https://www.npmjs.com/search?q=keywords:mdx
[markdownnpm]: https://www.npmjs.com/search?q=keywords:markdown
[remarktocnpm]: https://www.npmjs.com/search?q=keywords:remark%20toc
[remarktableofcontentsnpm]: https://www.npmjs.com/search?q=keywords:remark%20table%20of%20contents
[npm-url]: https://www.npmjs.com/package/remark-flexible-toc
[npm-image]: https://img.shields.io/npm/v/remark-flexible-toc
[github-license]: https://img.shields.io/github/license/ipikuka/remark-flexible-toc
[github-license-url]: https://github.com/ipikuka/remark-flexible-toc/blob/master/LICENSE
[github-build]: https://github.com/ipikuka/remark-flexible-toc/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/ipikuka/remark-flexible-toc/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/remark-flexible-toc
