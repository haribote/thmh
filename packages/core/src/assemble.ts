import path from "node:path";
import type { SourceFile } from "ts-morph";
import { Node } from "ts-morph";
import type { CvaCallResult } from "./adapters/cva";
import { extractCvaCalls } from "./adapters/cva";
import { extractReactProps } from "./adapters/react";
import {
  type ComponentCandidate,
  discoverComponentCandidates,
} from "./discover";
import { deriveAxes } from "./matrix";
import type { ComponentDoc, CvaDoc, PropDoc } from "./types";

export interface AssembleResult {
  components: ComponentDoc[];
  warnings: string[];
}

export function assembleComponents(
  sourceFile: SourceFile,
  root: string,
): AssembleResult {
  const candidates = discoverComponentCandidates(sourceFile);
  if (candidates.length === 0) {
    return { components: [], warnings: [] };
  }

  const { calls, warnings } = extractCvaCalls(sourceFile);
  const checker = sourceFile.getProject().getTypeChecker();
  const filePath = toRelativePosixPath(root, sourceFile.getFilePath());

  const components = candidates.map((candidate) => {
    const { description, props: declaredProps } = extractReactProps(
      candidate,
      checker,
    );
    const matchedCall = findAssociatedCvaCall(candidate, candidates, calls);
    const props = mergeProps(declaredProps, matchedCall?.doc);

    const componentDoc: ComponentDoc = {
      id: `${filePath}#${candidate.name}`,
      name: candidate.name,
      filePath,
      description,
      props,
      cva: matchedCall?.doc,
    };
    return componentDoc;
  });

  return { components, warnings };
}

function findAssociatedCvaCall(
  candidate: ComponentCandidate,
  allCandidates: ComponentCandidate[],
  calls: CvaCallResult[],
): CvaCallResult | undefined {
  if (calls.length === 0) return undefined;

  const paramTypeText = getFirstParamTypeText(candidate.declaration);
  const typeofMatch = calls.find((call) =>
    paramTypeText.includes(`typeof ${call.localName}`),
  );
  if (typeofMatch) return typeofMatch;

  if (calls.length === 1 && allCandidates.length === 1) {
    return calls[0];
  }

  return undefined;
}

function getFirstParamTypeText(declaration: Node): string {
  const signature = declaration.getType().getCallSignatures()[0];
  const paramSymbol = signature?.getParameters()[0];
  if (!paramSymbol) return "";

  const paramDeclaration = paramSymbol.getValueDeclarationOrThrow();
  if (!Node.isParameterDeclaration(paramDeclaration)) return "";

  const typeNodeText = paramDeclaration.getTypeNode()?.getText() ?? "";
  const paramTypeSymbol = paramDeclaration.getType().getSymbol();
  const declarationTexts = (paramTypeSymbol?.getDeclarations() ?? [])
    .map((node) => node.getText())
    .join("\n");

  return `${typeNodeText}\n${declarationTexts}`;
}

function mergeProps(
  declaredProps: PropDoc[],
  cvaDoc: CvaDoc | undefined,
): PropDoc[] {
  if (!cvaDoc) return declaredProps;

  const declaredNames = new Set(declaredProps.map((prop) => prop.name));
  const synthesizedProps = deriveAxes(cvaDoc)
    .filter((axis) => !declaredNames.has(axis.name))
    .map((axis): PropDoc => {
      const defaultOption = cvaDoc.defaultVariants?.[axis.name];
      return {
        name: axis.name,
        type: axisUnionType(axis.options),
        required: false,
        defaultValue:
          defaultOption !== undefined
            ? JSON.stringify(defaultOption)
            : undefined,
        source: "cva",
      };
    });

  return [...declaredProps, ...synthesizedProps];
}

function axisUnionType(options: string[]): string {
  if (
    options.length === 2 &&
    options.includes("true") &&
    options.includes("false")
  ) {
    return "boolean";
  }
  return options.map((option) => JSON.stringify(option)).join(" | ");
}

function toRelativePosixPath(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}
