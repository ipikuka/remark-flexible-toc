import { type Plugin } from "unified";
import { type Root, type HeadingData } from "mdast";
import { visit, CONTINUE } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// eslint-disable-next-line @typescript-eslint/ban-types
export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type HeadingParent =
  | "root"
  | "blockquote"
  | "footnoteDefinition"
  | "listItem"
  | "container"
  | "mdxJsxFlowElement";

export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

export type TocItem = {
  value: string;
  href: string;
  depth: HeadingDepth;
  numbering: number[];
  parent: HeadingParent;
  data?: Record<string, unknown>;
};

/**
 * tocName (default: "toc") - the key name which is attached into vfile.data
 * tocRef (default: []) — another way of exposing the tocItems
 * maxDepth (default: 6) — max heading depth to include in the table of contents; this is inclusive: when set to 3, level three headings are included
 * skipLevels (default: [1]) — disallowed heading levels, by default the article h1 is not expected to be in the TOC
 * skipParents (default: []) — disallow headings to be children of certain node types, (the "root" can not be skipped)
 * exclude — headings to skip, wrapped in new RegExp('^(' + value + ')$', 'i'); any heading matching this expression will not be present in the table of contents
 * prefix - the text that will be attached to headings as prefix, like "text-prefix-"
 * callback - It is a callback function to take the array of toc items as an argument
 */
export type FlexibleTocOptions = {
  tocName?: string;
  tocRef?: TocItem[];
  maxDepth?: HeadingDepth;
  skipLevels?: HeadingDepth[];
  skipParents?: Exclude<HeadingParent, "root">[];
  exclude?: string | string[];
  prefix?: string;
  callback?: (toc: TocItem[]) => undefined;
};

type PartiallyRequiredFlexibleTocOptions = Prettify<
  PartiallyRequired<
    FlexibleTocOptions,
    "tocName" | "tocRef" | "maxDepth" | "skipLevels" | "skipParents"
  >
>;

const DEFAULT_SETTINGS: FlexibleTocOptions = {
  tocName: "toc",
  tocRef: [],
  maxDepth: 6,
  skipLevels: [1],
  skipParents: [],
};

type ExtendedHeadingData = HeadingData & { hProperties: Record<string, unknown> };

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

    let numbering: number[] = [];

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
    } else if (depth < prevDepth) {
      numbering = prevNumbering.slice(0, depth);
      numbering[depth - 1]++;
    }

    tocItem.numbering = numbering;
  }
}

const RemarkFlexibleToc: Plugin<[FlexibleTocOptions?], Root> = (options) => {
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

  return (tree, file) => {
    const slugger = new GithubSlugger();
    const tocItems: TocItem[] = [];

    visit(tree, "heading", (_node, _index, _parent) => {
      /* v8 ignore next */
      if (!_parent || typeof _index === "undefined") return;

      const depth = _node.depth;
      const value = toString(_node, { includeImageAlt: false });
      const href = `#${settings.prefix ?? ""}${slugger.slug(value)}`;
      const parent = _parent.type;

      // maxDepth check
      if (depth > settings.maxDepth) return CONTINUE;

      // skipLevels check
      if (settings.skipLevels.includes(depth)) return CONTINUE;

      // skipParents check
      if (parent !== "root" && settings.skipParents.includes(parent)) return CONTINUE;

      // exclude check
      if (exludeRegexFilter && exludeRegexFilter.test(value)) return CONTINUE;

      // Other remark plugins can store custom data in node.data.hProperties
      // I omitted node.data.hName and node.data.hChildren since not related with toc
      const data = (_node.data as ExtendedHeadingData)?.hProperties
        ? { ...(_node.data as ExtendedHeadingData).hProperties }
        : undefined;

      tocItems.push({
        value,
        href,
        depth,
        numbering: [],
        parent,
        ...(data && { data }),
      });

      return CONTINUE;
    });

    addNumbering(tocItems);

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
