import { expect, test, describe } from "bun:test";
import { renderNode, renderPage } from "../src/view";
import type { ContentNode, AssetMetadata } from "../src/assets";

describe("View Rendering Engine - Phase 5", () => {
    test("renderNode - ARTICLE", () => {
        const node: ContentNode = {
            id: 'a1',
            title: 'T1',
            type: 'ARTICLE',
            category: 'C1',
            content: '<p>Hello</p>',
            metrics: { 'Key': 'Val' }
        };
        const html = renderNode(node);
        expect(html).toContain('<summary>T1</summary>');
        expect(html).toContain('Hello');
        expect(html).toContain('Key');
        expect(html).toContain('Val');
    });

    test("renderNode - LINK_LIST", () => {
        const node: ContentNode = {
            id: 'l1',
            title: 'Links',
            type: 'LINK_LIST',
            category: 'C1',
            links: [{ label: 'L1', url: 'http://u1', note: 'N1' }]
        };
        const html = renderNode(node);
        expect(html).toContain('href="http://u1"');
        expect(html).toContain('L1');
        expect(html).toContain('N1');
    });

    test("renderNode - ASSET_LIST", () => {
        const asset: AssetMetadata = {
            id: 'f1.pdf', filename: 'f1.pdf', name: 'N1', extension: 'pdf', category: 'C1', sizeBytes: 100, lastModified: 0, path: 'p1'
        };
        const node: ContentNode = {
            id: 'a2', title: 'Assets', type: 'ASSET_LIST', category: 'C1', assets: [asset]
        };
        const html = renderNode(node);
        expect(html).toContain('href="/f1.pdf"');
    });

    test("renderPage - full page integration with site metadata", () => {
        const nodes: ContentNode[] = [{ id: '1', title: 'T1', type: 'METRIC_CARD', category: 'CAT1', metrics: { 'M1': 'V1' } }];
        const html = renderPage(nodes);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('CAT1');
        expect(html).toContain('V1');
    });

    test("renderPage - renders dynamic SiteMetadata cleanly", () => {
        const { METADATA, CONTENT } = require("../src/content");
        const html = renderPage(CONTENT, METADATA);
        
        // Assert Metadata fields render in the output
        expect(html).toContain('Moe Capital');
        expect(html).toContain('Market Insights & Wise Investing');
        expect(html).toContain('Google');
        expect(html).toContain('Cloudflare');
        expect(html).toContain('Cerebras');
        expect(html).toContain('Eli Lilly');
        expect(html).toContain('Zero percent');
        expect(html).toContain('six percent');
        expect(html).toContain('twenty five percent');
        expect(html).toContain('MoneyAcademyKE');
    });

    test("renderPage - contains all 6 parts of Alice Schroeder interview with full content", () => {
        const { METADATA, CONTENT } = require("../src/content");
        const html = renderPage(CONTENT, METADATA);
        
        expect(html).toContain('Part 1: The Forging of a Skeptic');
        expect(html).toContain('Part 2: A Behind the Scenes Look at Wall St');
        expect(html).toContain('Part 3: Meeting The Oracle');
        expect(html).toContain('Part 4: Will The Real Warren Buffett');
        expect(html).toContain('Part 5: Buffett-');
        expect(html).toContain('Part 6: Curve Ball');
        
        // Ensure no truncation placeholders remain in output
        expect(html).not.toContain('<!-- Part 2-6 content correctly extracted and integrated -->');
        expect(html).toContain('Hi Alice Schroeder.');
        expect(html).toContain('Thanks for inviting me');
    });

    test("renderPage - contains all compilation links and categories", () => {
        const { METADATA, CONTENT } = require("../src/content");
        const html = renderPage(CONTENT, METADATA);
        
        expect(html).toContain('Special Editions');
        expect(html).toContain('Venture');
        expect(html).toContain('Investors');
        expect(html).toContain('Technical CEOs');
        expect(html).toContain('Value');
        expect(html).toContain('Lu Li');
        expect(html).toContain('Liew');
        expect(html).toContain('Andreessen');
        expect(html).toContain('Gurley');
        expect(html).toContain('Altman');
        expect(html).toContain('Morris');
        expect(html).toContain('Chang');
        expect(html).toContain('Lynch');
        expect(html).toContain('Buffett');
    });
});
