import type { JSDoc, Symbol as TsMorphSymbol, TypeChecker } from "ts-morph";
import { Node } from "ts-morph";
import type { ComponentCandidate } from "../discover";
import type { PropDoc } from "../types";

const MAX_TYPE_TEXT_LENGTH = 200;

export interface ReactAdapterResult {
  description?: string;
  props: PropDoc[];
}

export function extractReactProps(
  candidate: ComponentCandidate,
  checker: TypeChecker,
): ReactAdapterResult {
  const description = getComponentDescription(candidate.declaration);

  const signature = candidate.declaration.getType().getCallSignatures()[0];
  if (!signature) return { description, props: [] };

  const paramSymbol = signature.getParameters()[0];
  if (!paramSymbol) return { description, props: [] };

  const paramDeclaration = paramSymbol.getValueDeclarationOrThrow();
  const paramType = checker.getTypeOfSymbolAtLocation(
    paramSymbol,
    paramDeclaration,
  );
  const bindingPattern = getObjectBindingPattern(paramDeclaration);

  const props: PropDoc[] = [];
  for (const propSymbol of paramType.getProperties()) {
    const declarations = propSymbol.getDeclarations();
    if (!hasLocalTypeMemberDeclaration(declarations)) {
      continue;
    }

    const required = !propSymbol.isOptional();
    const propType = checker.getTypeOfSymbolAtLocation(
      propSymbol,
      candidate.declaration,
    );
    props.push({
      name: propSymbol.getName(),
      type: truncateTypeText(
        normalizeOptionalType(
          propType.getText(candidate.declaration),
          required,
        ),
      ),
      required,
      defaultValue: getPropDefaultValue(
        propSymbol,
        declarations,
        bindingPattern,
      ),
      description: getJsDocDescription(declarations),
      source: "declared",
    });
  }

  return { description, props };
}

function isUnderNodeModules(declaration: Node): boolean {
  return declaration.getSourceFile().getFilePath().includes("node_modules");
}

function hasLocalTypeMemberDeclaration(declarations: Node[]): boolean {
  return declarations.some(
    (declaration) =>
      !isUnderNodeModules(declaration) &&
      (Node.isPropertySignature(declaration) ||
        Node.isPropertyDeclaration(declaration)),
  );
}

function normalizeOptionalType(text: string, required: boolean): string {
  if (required) return text;
  const parts = text.split(" | ").filter((part) => part !== "undefined");
  return parts.length > 0 ? parts.join(" | ") : text;
}

function truncateTypeText(text: string): string {
  if (text.length <= MAX_TYPE_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TYPE_TEXT_LENGTH)}…`;
}

function getObjectBindingPattern(paramDeclaration: Node): Node | undefined {
  if (!Node.isParameterDeclaration(paramDeclaration)) return undefined;
  const nameNode = paramDeclaration.getNameNode();
  return Node.isObjectBindingPattern(nameNode) ? nameNode : undefined;
}

function getComponentDescription(declaration: Node): string | undefined {
  if (Node.isFunctionDeclaration(declaration)) {
    return jsDocsToDescription(declaration.getJsDocs());
  }
  if (Node.isVariableDeclaration(declaration)) {
    const statement = declaration.getVariableStatement();
    if (statement) return jsDocsToDescription(statement.getJsDocs());
  }
  return undefined;
}

function getJsDocDescription(declarations: Node[]): string | undefined {
  for (const declaration of declarations) {
    if (!Node.isJSDocable(declaration)) continue;
    const description = jsDocsToDescription(declaration.getJsDocs());
    if (description) return description;
  }
  return undefined;
}

function jsDocsToDescription(jsDocs: JSDoc[]): string | undefined {
  const description = jsDocs[0]?.getDescription().trim();
  return description ? description : undefined;
}

function getPropDefaultValue(
  propSymbol: TsMorphSymbol,
  declarations: Node[],
  bindingPattern: Node | undefined,
): string | undefined {
  for (const declaration of declarations) {
    if (!Node.isJSDocable(declaration)) continue;
    for (const jsDoc of declaration.getJsDocs()) {
      for (const tag of jsDoc.getTags()) {
        if (tag.getTagName() !== "default") continue;
        const value = tag.getCommentText()?.trim();
        if (value) return value;
      }
    }
  }

  if (bindingPattern && Node.isObjectBindingPattern(bindingPattern)) {
    for (const element of bindingPattern.getElements()) {
      if (element.getName() !== propSymbol.getName()) continue;
      const initializer = element.getInitializer();
      if (initializer) return initializer.getText();
    }
  }

  return undefined;
}
