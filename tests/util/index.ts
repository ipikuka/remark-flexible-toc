import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkHeadingId from "remark-heading-id";
import remarkRehype from "remark-rehype";
import rehypeFormat from "rehype-format";
import rehypeStringify from "rehype-stringify";
import type { VFileCompatible, VFile } from "vfile";

import plugin, { type FlexibleTocOptions } from "../../src";

const compilerCreator = (options?: FlexibleTocOptions) =>
  unified()
    .use(remarkParse)
    .use(gfm)
    .use(remarkHeadingId)
    .use(plugin, options)
    .use(remarkRehype)
    .use(rehypeFormat)
    .use(rehypeStringify);

export const process = async (
  content: VFileCompatible,
  options?: FlexibleTocOptions,
): Promise<VFile> => {
  return compilerCreator(options).process(content);
};
