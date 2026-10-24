import type { Plugin } from "unified";
import type { PhrasingContent, Root } from "mdast";
import type { Test } from "unist-util-is";
import structuredClone from "@ungap/structured-clone";
import { convert } from "unist-util-is";
import { visit, CONTINUE } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type HeadingParent =
  "root" | "blockquote" | "footnoteDefinition" | "listItem" | "container" | "mdxJsxFlowElement";

export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

export type TocItem = {
  value: string;
  content: PhrasingContent[];
  href: string;
  depth: HeadingDepth;
  numbering: number[];
  parent: HeadingParent;
  parentPath: number[];
  data?: {
    [PropertyName: string]: string | number | boolean | (string | number)[] | null | undefined;
  };
};

/**
 * tocName (default: "toc") - the key name which is attached into vfile.data
 * tocRef (default: []) — another way of exposing the tocItems
 * maxDepth (default: 6) — max heading depth to include in the table of contents; this is inclusive: when set to 3, level three headings are included
 * skipLevels (default: [1]) — disallowed heading levels, by default the article h1 is not expected to be in the TOC
 * includeParents — allow headings to be children of certain nodes; internally uses unist-util-is Test
 * skipParents (default: []) — disallow headings to be children of certain nodes; internally uses unist-util-is Test
 * exclude — headings to skip, wrapped in new RegExp('^(' + value + ')$', 'i'); any heading matching this expression will not be present in the table of contents
 * prefix - the text that will be attached to headings as prefix, like "text-prefix-"
 * after — heading to look for, wrapped in new RegExp('^(' + value + ')$', 'i'); the TOC items will be generated after that heading section
 * callback - It is a callback function to take the array of toc items as an argument
 */
export type FlexibleTocOptions = {
  tocName?: string;
  tocRef?: TocItem[];
  maxDepth?: HeadingDepth;
  skipLevels?: HeadingDepth[];
  includeParents?: Test;
  skipParents?: Test;
  exclude?: string | string[];
  prefix?: string;
  after?: string;
  callback?: (toc: TocItem[]) => undefined;
};

export type GenerateTocItemsOptions = Pick<
  FlexibleTocOptions,
  "maxDepth" | "skipLevels" | "includeParents" | "skipParents" | "exclude" | "prefix" | "after"
>;

type PartiallyRequiredFlexibleTocOptions = Prettify<
  PartiallyRequired<FlexibleTocOptions, "tocName" | "tocRef" | "maxDepth" | "skipLevels">
>;

const DEFAULT_SETTINGS: FlexibleTocOptions = {
  tocName: "toc",
  tocRef: [],
  maxDepth: 6,
  skipLevels: [1],
};

/**
 * adds numberings to the TOC items.
 * why "number[]"? It is because up to you joining with dot or dash or slicing the first number (reserved for h1)
 *
 * [1]
 * [1,1]
 * [1,2]
 * [1,2,1]
 */
function addNumbering(arr: TocItem[]) {
  for (let i = 0; i < arr.length; i++) {
    const tocItem = arr[i];
    const depth = tocItem.depth;

    let numbering: number[];

    const prevObj = i > 0 ? arr[i - 1] : undefined;
    const prevDepth = prevObj ? prevObj.depth : undefined;
    const prevNumbering = prevObj ? prevObj.numbering : undefined;

    if (!prevNumbering || !prevDepth) {
      numbering = Array.from({ length: depth }, () => 1);
    } else if (depth === prevDepth) {
      numbering = [...prevNumbering];
      numbering[depth - 1]++;
    } else if (depth > prevDepth) {
      numbering = [
        ...prevNumbering,
        ...(Array.from(
          { length: depth - prevDepth }, // if depth is more bigger than prevDepth, put more "1" inside the array
          () => 1,
        ) as HeadingDepth[]),
      ];
    } else {
      // if (depth < prevDepth)
      numbering = prevNumbering.slice(0, depth);
      numbering[depth - 1]++;
    }

    tocItem.numbering = numbering;
  }
}

function createNodePathMap(tree: Root): WeakMap<object, number[]> {
  const paths = new WeakMap<object, number[]>();

  const visitNode = (node: unknown, path: number[]) => {
    /* v8 ignore next -- @preserve */
    if (!node || typeof node !== "object") return;

    paths.set(node, path);

    const children = (node as { children?: unknown }).children;
    if (!Array.isArray(children)) return;

    (children as unknown[]).forEach((child, index) => {
      visitNode(child, [...path, index]);
    });
  };

  visitNode(tree, []);
  return paths;
}

function copyTocContent(nodes: PhrasingContent[]): PhrasingContent[] {
  const results: PhrasingContent[] = [];

  for (const node of nodes) {
    if (node.type === "footnoteReference") continue;

    if (node.type === "link" || node.type === "linkReference") {
      results.push(...copyTocContent(node.children));
      continue;
    }

    const copy = structuredClone(node);
    delete copy.position;

    if ("children" in copy) {
      copy.children = copyTocContent(copy.children);
    }

    results.push(copy);
  }

  return results;
}

export function generateTocItemsFromMdast(
  tree: Root,
  options?: GenerateTocItemsOptions,
): TocItem[] {
  const settings = Object.assign(
    {},
    DEFAULT_SETTINGS,
    options,
  ) as PartiallyRequiredFlexibleTocOptions;

  const exludeRegexFilter =
    settings.exclude &&
    (Array.isArray(settings.exclude)
      ? new RegExp("^(" + settings.exclude.join("|") + ")$", "i")
      : new RegExp("^(" + settings.exclude + ")$", "i"));
  const afterRegexFilter = settings.after && new RegExp("^(" + settings.after + ")$", "i");

  const includeParentsFilter = settings.includeParents && convert(settings.includeParents);
  const skipParentsFilter = settings.skipParents && convert(settings.skipParents);

  const slugger = new GithubSlugger();
  const parentPaths = createNodePathMap(tree);
  const tocItems: TocItem[] = [];
  let afterHeadingDepth: HeadingDepth | undefined;
  let afterSectionEnded = !afterRegexFilter;

  visit(tree, "heading", (_node, _index, _parent) => {
    /* v8 ignore next -- @preserve */
    if (!_parent || typeof _index === "undefined") return;

    const depth = _node.depth;
    const value = toString(_node, { includeImageAlt: false });
    let href = `#${settings.prefix ?? ""}${slugger.slug(value)}`;
    const parent = _parent.type;
    /* v8 ignore next -- @preserve */
    const parentPath = parentPaths.get(_parent) ?? [];
    const parentIncluded = !includeParentsFilter || includeParentsFilter(_parent);
    const parentSkipped = !!skipParentsFilter && skipParentsFilter(_parent);
    const parentAllowed = parentIncluded && !parentSkipped;

    // after check
    if (afterRegexFilter) {
      if (!afterHeadingDepth) {
        if (parentAllowed && afterRegexFilter.test(value)) afterHeadingDepth = depth;
        return CONTINUE;
      }

      if (!afterSectionEnded) {
        if (!parentAllowed || depth > afterHeadingDepth) return CONTINUE;
        afterSectionEnded = true;
      }
    }

    // maxDepth check
    if (depth > settings.maxDepth) return CONTINUE;

    // skipLevels check
    if (settings.skipLevels.includes(depth)) return CONTINUE;

    // includeParents check
    if (!parentIncluded) return CONTINUE;

    // skipParents check
    if (parentSkipped) return CONTINUE;

    // exclude check
    if (exludeRegexFilter && exludeRegexFilter.test(value)) return CONTINUE;

    // Other remark plugins can store custom data in node.data.hProperties
    // I omitted node.data.hName and node.data.hChildren since not related with toc

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore, vscode resolves the type but tsc build raises an error awkwardly, saying "hProperties" does not exist in "HeadingData".
    const hProperties = _node.data?.hProperties;
    const data = hProperties ? { ...hProperties } : undefined;

    if (data?.["id"]) href = `#${data["id"]}`;

    tocItems.push({
      value,
      content: copyTocContent(_node.children),
      href,
      depth,
      numbering: [],
      parent,
      parentPath,
      ...(data && { data }),
    });

    return CONTINUE;
  });

  addNumbering(tocItems);

  return tocItems;
}

const RemarkFlexibleToc: Plugin<[FlexibleTocOptions?], Root> = (options) => {
  const settings = Object.assign(
    {},
    DEFAULT_SETTINGS,
    options,
  ) as PartiallyRequiredFlexibleTocOptions;

  return (tree, file) => {
    const tocItems = generateTocItemsFromMdast(tree, options);

    // it is allowed to modify the TOC in the callback
    settings.callback?.(tocItems);

    // method - 1 for exposing the data via vfile.data **************************

    // other plugins are not allowed to mutate the exposed TOC
    // The spreading is slower than push but need to fresh copy
    file.data[settings.tocName] = [...tocItems];

    // method - 2 for exposing the data via reference array *********************

    if (options?.tocRef) {
      // prevent dublication if the plugin is called more than once
      settings.tocRef.length = 0;

      tocItems.forEach((tocItem) => {
        // the tocRef is not allowed to mutate the vfile.data.toc
        settings.tocRef.push(tocItem);
      });
    }
  };
};

export default RemarkFlexibleToc;
