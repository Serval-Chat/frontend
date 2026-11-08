const INTERACTIVE_ELEMENTS = [
  "button", "input", "textarea", "select", "a", "label",
];

const TEXT_ELEMENTS = ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6"];

const DEFAULT_ELEMENTS = new Set([...INTERACTIVE_ELEMENTS, ...TEXT_ELEMENTS]);

const DEFAULT_ALLOWED_PATHS = ["src/ui/primitives/"];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

export default {
  rules: {
    "no-raw-controls-outside-primitives": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Interactive and text elements must come from src/ui/primitives " +
            "(Button, Input, Link, Text, Heading, ...) so focus, hover, keyboard " +
            "and typography behave the same everywhere. Structural elements " +
            "(div, ul, img, svg, ...) are allowed anywhere.",
        },
        messages: {
          rawElement:
            "Raw <{{element}}> outside src/ui/primitives. Use the matching " +
            "primitive, or add one if none fits.",
        },
        schema: [
          {
            type: "object",
            properties: {
              allowedPaths: {
                type: "array",
                items: { type: "string" },
              },
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
        const filePath = normalizePath(context.filename);
        const options = context.options[0] || {};
        const allowedPaths = options.allowedPaths || DEFAULT_ALLOWED_PATHS;

        if (allowedPaths.some((allowed) => filePath.includes(allowed))) {
          return {};
        }

        const elements = new Set([
          ...DEFAULT_ELEMENTS,
          ...(options.additionalElements || []),
        ]);

        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier") return;
            const element = node.name.name;
            if (elements.has(element)) {
              context.report({ node, messageId: "rawElement", data: { element } });
            }
          },
        };
      },
    },
  },
};
