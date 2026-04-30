const DOM_ELEMENTS = new Set([
  "a", "abbr", "address", "area", "article", "aside",
  "audio", "b", "base", "bdi", "bdo", "blockquote", "body",
  "br", "button", "canvas", "caption", "cite", "code", "col",
  "colgroup", "data", "datalist", "dd", "del", "details", "dfn",
  "dialog", "div", "dl", "dt", "em", "embed", "fieldset",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html",
  "i", "iframe", "img", "input", "ins", "kbd", "label", "legend",
  "li", "link", "main", "map", "mark", "menu", "meta", "meter",
  "nav", "noscript", "object", "ol", "optgroup", "option", "output",
  "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s",
  "samp", "script", "section", "select", "small", "source", "span",
  "strong", "style", "sub", "summary", "sup", "table", "tbody",
  "td", "template", "textarea", "tfoot", "th", "thead", "time",
  "title", "tr", "track", "u", "ul", "var", "video", "wbr",
  "svg", "circle", "rect", "path", "g", "line", "polyline",
  "polygon", "text", "defs", "use", "symbol",
]);

const TYPOGRAPHY_ELEMENTS = new Set([
  "p", "span", "h1", "h2", "h3", "h4", "h5", "h6",
  "header", "footer", "label", "blockquote", "cite",
  "abbr", "address", "b", "strong", "em", "i", "s",
  "small", "sub", "sup", "mark", "del", "ins", "q",
  "dfn", "kbd", "samp", "var", "code", "pre", "time",
  "legend", "caption", "dt", "dd", "figcaption", "summary",
]);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function isInsideFolder(filePath, folderSegment) {
  const normalized = normalizePath(filePath);
  return normalized.includes(`/src/${folderSegment}/`) ||
    normalized.includes(`src/${folderSegment}/`);
}

export default {
  rules: {
    "no-raw-jsx-outside-ui": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow raw DOM elements outside src/ui/. Use components from src/ui/ instead.",
        },
        messages: {
          noRawElement:
            "Raw DOM element <{{element}}> is not allowed outside src/ui/. " +
            "Use a component from src/ui/ instead.",
        },
        schema: [
          {
            type: "object",
            properties: {
              additionalElements: {
                type: "array",
                items: { type: "string" },
              },
              ignore: {
                type: "array",
                items: { type: "string" },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const filePath = normalizePath(context.getFilename());

        if (isInsideFolder(filePath, "ui")) return {};

        const options = context.options[0] || {};
        const extraElements = new Set(options.additionalElements || []);
        const ignoredFiles = options.ignore || [];

        if (ignoredFiles.some((pattern) => filePath.includes(pattern))) {
          return {};
        }

        return {
          JSXOpeningElement(node) {
            const name = node.name;

            if (name.type === "JSXIdentifier") {
              const elementName = name.name;
              if (
                DOM_ELEMENTS.has(elementName) ||
                extraElements.has(elementName)
              ) {
                context.report({
                  node,
                  messageId: "noRawElement",
                  data: { element: elementName },
                });
              }
            }
          },
        };
      },
    },

    "no-typography-elements-in-ui": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow typography/text elements inside src/ui/ outside src/ui/typography/. " +
            "Place text primitives in src/ui/typography/ instead.",
        },
        messages: {
          noTypographyElement:
            "Typography element <{{element}}> is not allowed in src/ui/ outside src/ui/typography/. " +
            "Define it in src/ui/typography/ and import it here.",
        },
        schema: [
          {
            type: "object",
            properties: {
              additionalElements: {
                type: "array",
                items: { type: "string" },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const filePath = normalizePath(context.getFilename());

        if (!isInsideFolder(filePath, "ui")) return {};

        if (isInsideFolder(filePath, "ui/typography")) return {};

        const options = context.options[0] || {};
        const extraElements = new Set(options.additionalElements || []);

        return {
          JSXOpeningElement(node) {
            const name = node.name;

            if (name.type === "JSXIdentifier") {
              const elementName = name.name;
              if (
                TYPOGRAPHY_ELEMENTS.has(elementName) ||
                extraElements.has(elementName)
              ) {
                context.report({
                  node,
                  messageId: "noTypographyElement",
                  data: { element: elementName },
                });
              }
            }
          },
        };
      },
    },
  },
};