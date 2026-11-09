import { RuleTester } from "eslint";

import noUi from "./no-ui.js";

const rule = noUi.rules["no-raw-controls-outside-primitives"];

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const feature = "/repo/frontend/src/features/chat/Composer.tsx";
const primitive = "/repo/frontend/src/ui/primitives/Button.tsx";

ruleTester.run("no-raw-controls-outside-primitives", rule, {
  valid: [
    { code: "<div className='flex'><ul><li /></ul><img alt='' /></div>", filename: feature },
    { code: "<svg><path d='M0 0' /></svg>", filename: feature },
    { code: "<span className='flex gap-1'><Icon /><Badge /></span>", filename: feature },
    { code: "<span className='h-2 w-2 rounded-full bg-success' />", filename: feature },
    { code: "<span>{/* note */}</span>", filename: feature },
    { code: "<Button onClick={go}>Go</Button>", filename: feature },
    { code: "<button type='button' />", filename: primitive },
    { code: "<p><span>text</span></p>", filename: primitive },
    {
      code: "<input />",
      filename: "/repo/frontend/src/dev/nt/NTSlider.tsx",
      options: [{ allowedPaths: ["src/ui/primitives/", "src/dev/nt/"] }],
    },
    {
      code: "<button />",
      filename: "C:\\repo\\frontend\\src\\ui\\primitives\\Button.tsx",
    },
  ],
  invalid: [
    {
      code: "<button onClick={go}>Go</button>",
      filename: feature,
      errors: [{ messageId: "rawElement", data: { element: "button" } }],
    },
    {
      code: "<label><input /><textarea /><select /></label>",
      filename: feature,
      errors: ["label", "input", "textarea", "select"].map((element) => ({
        messageId: "rawElement",
        data: { element },
      })),
    },
    {
      code: "<div><h2>Title</h2><p>Body <span>x</span></p><a href='/'>l</a></div>",
      filename: feature,
      errors: ["h2", "p", "span", "a"].map((element) => ({
        messageId: "rawElement",
        data: { element },
      })),
    },
    {
      code: "<button />",
      filename: "/repo/frontend/src/ui/components/common/Button.tsx",
      errors: [{ messageId: "rawElement" }],
    },
    {
      code: "<span className='text-sm'>{user.name}</span>",
      filename: feature,
      errors: [{ messageId: "rawElement", data: { element: "span" } }],
    },
    {
      code: "<span>Total: <b>{n}</b></span>",
      filename: feature,
      errors: [{ messageId: "rawElement", data: { element: "span" } }],
    },
    {
      code: "<dialog />",
      filename: feature,
      options: [{ additionalElements: ["dialog"] }],
      errors: [{ messageId: "rawElement", data: { element: "dialog" } }],
    },
  ],
});
