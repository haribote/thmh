import type { CallExpression, SourceFile } from "ts-morph";
import { Node, SyntaxKind } from "ts-morph";
import type { CompoundVariantDoc, CvaDoc } from "../types";

export interface CvaCallResult {
  exportName?: string;
  localName: string;
  doc: CvaDoc;
}

export interface CvaExtractionResult {
  calls: CvaCallResult[];
  warnings: string[];
}

export function extractCvaCalls(sourceFile: SourceFile): CvaExtractionResult {
  const warnings: string[] = [];
  const calls: CvaCallResult[] = [];
  const cvaIdentifiers = findCvaIdentifiers(sourceFile);
  if (cvaIdentifiers.length === 0) {
    return { calls, warnings };
  }

  const filePath = sourceFile.getFilePath();
  for (const callExpression of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const callee = callExpression.getExpression();
    if (
      !Node.isIdentifier(callee) ||
      !cvaIdentifiers.includes(callee.getText())
    ) {
      continue;
    }
    const call = extractCvaCall(callExpression, filePath, warnings);
    if (call) {
      calls.push(call);
    }
  }
  return { calls, warnings };
}

function findCvaIdentifiers(sourceFile: SourceFile): string[] {
  const identifiers: string[] = [];
  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    if (
      importDeclaration.getModuleSpecifierValue() !== "class-variance-authority"
    ) {
      continue;
    }
    for (const namedImport of importDeclaration.getNamedImports()) {
      if (namedImport.getName() !== "cva") continue;
      identifiers.push(
        namedImport.getAliasNode()?.getText() ?? namedImport.getName(),
      );
    }
  }
  return identifiers;
}

function extractCvaCall(
  callExpression: CallExpression,
  filePath: string,
  warnings: string[],
): CvaCallResult | undefined {
  const target = resolveAssignmentTarget(callExpression);
  if (!target) {
    warnings.push(
      `${filePath}: cva call is not assigned to a variable, skipping`,
    );
    return undefined;
  }

  const [baseArg, configArg] = callExpression.getArguments();
  const base = evaluateBase(baseArg, filePath, warnings);

  let variants: Record<string, Record<string, string>> = {};
  let defaultVariants: Record<string, string> | undefined;
  let compoundVariants: CompoundVariantDoc[] | undefined;

  if (configArg) {
    if (!Node.isObjectLiteralExpression(configArg)) {
      warnings.push(
        `${filePath}: unsupported node in cva config: ${configArg.getKindName()}`,
      );
    } else {
      const variantsInitializer = getPropertyInitializer(configArg, "variants");
      if (variantsInitializer) {
        variants = evaluateVariants(variantsInitializer, filePath, warnings);
      }

      const defaultVariantsInitializer = getPropertyInitializer(
        configArg,
        "defaultVariants",
      );
      if (defaultVariantsInitializer) {
        defaultVariants = evaluateScalarRecord(
          defaultVariantsInitializer,
          "defaultVariants",
          filePath,
          warnings,
        );
      }

      const compoundVariantsInitializer = getPropertyInitializer(
        configArg,
        "compoundVariants",
      );
      if (compoundVariantsInitializer) {
        compoundVariants = evaluateCompoundVariants(
          compoundVariantsInitializer,
          filePath,
          warnings,
        );
      }
    }
  }

  const doc: CvaDoc = {
    exportName: target.exportName,
    base,
    variants,
    defaultVariants,
    compoundVariants,
  };
  return { exportName: target.exportName, localName: target.localName, doc };
}

function resolveAssignmentTarget(
  callExpression: CallExpression,
): { localName: string; exportName?: string } | undefined {
  const parent = callExpression.getParent();
  if (!Node.isVariableDeclaration(parent)) return undefined;
  const localName = parent.getName();
  const statement = parent.getVariableStatement();
  const exportName = statement?.isExported() ? localName : undefined;
  return { localName, exportName };
}

function getPropertyInitializer(
  objectLiteral: Node,
  name: string,
): Node | undefined {
  if (!Node.isObjectLiteralExpression(objectLiteral)) return undefined;
  const property = objectLiteral.getProperty(name);
  if (!property || !Node.isPropertyAssignment(property)) return undefined;
  return property.getInitializer();
}

function evaluateBase(
  arg: Node | undefined,
  filePath: string,
  warnings: string[],
): string | undefined {
  if (!arg) return undefined;

  const literal = evaluateStringLikeText(arg);
  if (literal !== undefined) return literal;

  if (Node.isArrayLiteralExpression(arg)) {
    const parts: string[] = [];
    for (const element of arg.getElements()) {
      const text = evaluateStringLikeText(element);
      if (text === undefined) {
        warnings.push(
          `${filePath}: unsupported node in cva base: ${element.getKindName()}`,
        );
        return undefined;
      }
      parts.push(text);
    }
    return parts.join(" ");
  }

  warnings.push(
    `${filePath}: unsupported node in cva base: ${arg.getKindName()}`,
  );
  return undefined;
}

function evaluateVariants(
  node: Node,
  filePath: string,
  warnings: string[],
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  if (!Node.isObjectLiteralExpression(node)) {
    warnings.push(
      `${filePath}: unsupported node in cva variants: ${node.getKindName()}`,
    );
    return result;
  }

  for (const axisProperty of node.getProperties()) {
    if (!Node.isPropertyAssignment(axisProperty)) {
      warnings.push(
        `${filePath}: unsupported node in cva variants: ${axisProperty.getKindName()}`,
      );
      continue;
    }
    const axisName = evaluatePropertyName(axisProperty.getNameNode());
    if (axisName === undefined) {
      warnings.push(
        `${filePath}: unsupported node in cva variants: ${axisProperty.getNameNode().getKindName()}`,
      );
      continue;
    }
    const axisInitializer = axisProperty.getInitializer();
    if (!axisInitializer || !Node.isObjectLiteralExpression(axisInitializer)) {
      warnings.push(
        `${filePath}: unsupported node in cva variants: ${axisInitializer?.getKindName() ?? "missing"}`,
      );
      continue;
    }

    const options: Record<string, string> = {};
    for (const optionProperty of axisInitializer.getProperties()) {
      if (!Node.isPropertyAssignment(optionProperty)) {
        warnings.push(
          `${filePath}: unsupported node in cva variants: ${optionProperty.getKindName()}`,
        );
        continue;
      }
      const optionName = evaluatePropertyName(optionProperty.getNameNode());
      if (optionName === undefined) {
        warnings.push(
          `${filePath}: unsupported node in cva variants: ${optionProperty.getNameNode().getKindName()}`,
        );
        continue;
      }
      const value = evaluateScalarValue(optionProperty.getInitializer());
      if (value === undefined) {
        warnings.push(
          `${filePath}: unsupported node in cva variants: ${optionProperty.getInitializer()?.getKindName() ?? "missing"}`,
        );
        continue;
      }
      options[optionName] = value;
    }
    result[axisName] = options;
  }

  return result;
}

function evaluateScalarRecord(
  node: Node,
  label: string,
  filePath: string,
  warnings: string[],
): Record<string, string> | undefined {
  if (!Node.isObjectLiteralExpression(node)) {
    warnings.push(
      `${filePath}: unsupported node in cva ${label}: ${node.getKindName()}`,
    );
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const property of node.getProperties()) {
    if (!Node.isPropertyAssignment(property)) {
      warnings.push(
        `${filePath}: unsupported node in cva ${label}: ${property.getKindName()}`,
      );
      continue;
    }
    const name = evaluatePropertyName(property.getNameNode());
    if (name === undefined) {
      warnings.push(
        `${filePath}: unsupported node in cva ${label}: ${property.getNameNode().getKindName()}`,
      );
      continue;
    }
    const value = evaluateScalarValue(property.getInitializer());
    if (value === undefined) {
      warnings.push(
        `${filePath}: unsupported node in cva ${label}: ${property.getInitializer()?.getKindName() ?? "missing"}`,
      );
      continue;
    }
    result[name] = value;
  }
  return result;
}

function evaluateCompoundVariants(
  node: Node,
  filePath: string,
  warnings: string[],
): CompoundVariantDoc[] | undefined {
  if (!Node.isArrayLiteralExpression(node)) {
    warnings.push(
      `${filePath}: unsupported node in cva compoundVariants: ${node.getKindName()}`,
    );
    return undefined;
  }

  const result: CompoundVariantDoc[] = [];
  for (const element of node.getElements()) {
    if (!Node.isObjectLiteralExpression(element)) {
      warnings.push(
        `${filePath}: unsupported node in cva compoundVariants: ${element.getKindName()}`,
      );
      continue;
    }

    const conditions: Record<string, string> = {};
    let className: string | undefined;
    let entryValid = true;

    for (const property of element.getProperties()) {
      if (!Node.isPropertyAssignment(property)) {
        warnings.push(
          `${filePath}: unsupported node in cva compoundVariants: ${property.getKindName()}`,
        );
        entryValid = false;
        continue;
      }
      const name = evaluatePropertyName(property.getNameNode());
      if (name === undefined) {
        warnings.push(
          `${filePath}: unsupported node in cva compoundVariants: ${property.getNameNode().getKindName()}`,
        );
        entryValid = false;
        continue;
      }
      const value = evaluateScalarValue(property.getInitializer());
      if (value === undefined) {
        warnings.push(
          `${filePath}: unsupported node in cva compoundVariants: ${property.getInitializer()?.getKindName() ?? "missing"}`,
        );
        entryValid = false;
        continue;
      }
      if (name === "class" || name === "className") {
        className = value;
      } else {
        conditions[name] = value;
      }
    }

    if (!entryValid || className === undefined) continue;
    result.push({ conditions, className });
  }

  return result;
}

function evaluatePropertyName(nameNode: Node): string | undefined {
  if (Node.isIdentifier(nameNode)) return nameNode.getText();
  if (
    Node.isStringLiteral(nameNode) ||
    Node.isNoSubstitutionTemplateLiteral(nameNode)
  ) {
    return nameNode.getLiteralText();
  }
  if (Node.isNumericLiteral(nameNode)) return nameNode.getText();
  return undefined;
}

function evaluateScalarValue(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (
    Node.isStringLiteral(node) ||
    Node.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.getLiteralText();
  }
  if (Node.isTrueLiteral(node)) return "true";
  if (Node.isFalseLiteral(node)) return "false";
  if (Node.isNumericLiteral(node)) return node.getText();
  return undefined;
}

function evaluateStringLikeText(node: Node): string | undefined {
  if (
    Node.isStringLiteral(node) ||
    Node.isNoSubstitutionTemplateLiteral(node)
  ) {
    return node.getLiteralText();
  }
  return undefined;
}
