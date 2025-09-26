import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { ParsedXmlResult } from "../types/index.js";

export class TallyXmlParser {
	private readonly parser: XMLParser;
	private readonly builder: XMLBuilder;

	constructor() {
		// Configure parser for Tally XML structure
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "",
			textNodeName: "_text",
			allowBooleanAttributes: false,
			parseAttributeValue: true,
			trimValues: true,
			parseTagValue: true,
			processEntities: false,
		});

		this.builder = new XMLBuilder({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			format: true,
			indentBy: "  ",
		});
	}

	parse(xmlString: string): ParsedXmlResult {
		try {
			return this.parser.parse(xmlString) as ParsedXmlResult;
		} catch (error: any) {
			throw new Error(`XML parsing failed: ${error.message}`);
		}
	}

	build(obj: any): string {
		try {
			return this.builder.build(obj);
		} catch (error: any) {
			throw new Error(`XML building failed: ${error.message}`);
		}
	}

	// Helper methods for common Tally XML operations
	findElements(data: ParsedXmlResult, elementName: string): any[] {
		const results: any[] = [];

		function search(obj: any): void {
			if (Array.isArray(obj)) {
				for (const item of obj) {
					search(item);
				}
			} else if (typeof obj === "object" && obj !== null) {
				for (const key of Object.keys(obj)) {
					if (key === elementName) {
						if (Array.isArray(obj[key])) {
							results.push(...obj[key]);
						} else {
							results.push(obj[key]);
						}
					} else {
						search(obj[key]);
					}
				}
			}
		}

		search(data);
		return results;
	}

	getElementText(element: any, path: string[]): string | null {
		let current = element;
		for (const key of path) {
			if (current && typeof current === "object") {
				current = current[key];
			} else {
				return null;
			}
		}
		return typeof current === "string" ? current : null;
	}

	getElementAttribute(element: any, attributeName: string): string | null {
		if (
			element &&
			typeof element === "object" &&
			element[`@_${attributeName}`]
		) {
			return element[`@_${attributeName}`];
		}
		return null;
	}
}

// Factory function for creating XML parser
export function createXmlParser(): TallyXmlParser {
	return new TallyXmlParser();
}
