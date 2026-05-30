import type { Data, Element, Literal, Node, Parents, Root, RootContent, Text } from "hast";
import { stringifyEntities } from "stringify-entities";
import type { Processor } from "unified";

type ValidValue = string | number | boolean | Array<string | number>;
export interface Raw extends Literal {
  type: "raw";
  data?: Data | undefined;
}

const textEscapeSubset = ["<", "{", "}"];
const attributeValueEscapeSubset = ['"', "&", "{", "}"];
// https://developer.mozilla.org/docs/Glossary/Void_element
const htmlVoidElements = [
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

export function rehypeSveltify(this: Processor): void {
  this.compiler = (tree: Node) => compileChildren(tree as Parents);
}

export function compileChildren(parent: Parents): string {
  return ((parent.children ?? []) as (Root | RootContent | Raw)[])
    .map((node) => {
      switch (node.type) {
        case "root": {
          return compileChildren(node);
        }
        case "element": {
          return compileElement(node);
        }
        case "text": {
          return compileText(node, parent);
        }
        case "raw": {
          return node.value;
        }
        default: {
          return "";
        }
      }
    })
    .filter(Boolean)
    .join("");
}

export function compileElement(node: Element): string {
  const attributes = Object.entries(node.properties)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => serializeAttribute(key, value as ValidValue))
    .filter(Boolean)
    .map((s) => ` ${s}`)
    .join("");

  const isVoidElement = htmlVoidElements.includes(node.tagName);
  if (isVoidElement) {
    return `<${node.tagName}${attributes} />`;
  } else {
    const openTag = `<${node.tagName}${attributes}>`;
    const content = compileChildren(node);
    const closeTag = `</${node.tagName}>`;
    return (
      openTag +
      (node.tagName === "script" ? "\n" : "") +
      content +
      (node.tagName === "script" ? "\n" : "") +
      closeTag +
      (node.tagName === "script" ? "\n" : "")
    );
  }
}

export function serializeAttribute(_key: string, value: ValidValue): string {
  const key = _key.toLowerCase() === "classname" ? "class" : _key;
  if (key.startsWith("raw:")) {
    if (typeof value !== "string") {
      throw new Error(`Raw attribute "${key}" requires a string value, received ${typeof value}`);
    }
    return `${key.slice("raw:".length)}=${value}`;
  }

  if (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === "number" && Number.isNaN(value))
  ) {
    return "";
  }

  if (value === true) {
    return key;
  }

  if (typeof value === "number") {
    return `${key}=${value}`;
  }

  const stringValue = Array.isArray(value) ? value.join(" ") : String(value);
  const safeValue = stringifyEntities(stringValue, {
    useNamedReferences: true,
    subset: attributeValueEscapeSubset,
    attribute: true,
  });
  return `${key}="${safeValue}"`;
}

export function compileText(node: Text, parent: Parents): string {
  const shouldEscape = !(
    parent.type === "element" &&
    (parent.tagName === "script" || parent.tagName === "style")
  );
  return shouldEscape
    ? stringifyEntities(node.value, {
        useNamedReferences: true,
        subset: textEscapeSubset,
      })
    : node.value;
}
