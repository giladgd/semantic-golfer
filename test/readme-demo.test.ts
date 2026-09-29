import assert from "node:assert/strict";
import {test} from "node:test";
import {compileReadmeDemo} from "../scripts/readmeDemo.ts";

test("the README export bakes changing text, styles, and visibility into script-free CSS", () => {
    const frame = (at: number, text: string, focused: string) => ({at, value: {
        tag: "div", attributes: [["data-focused", focused]] as Array<[string, string]>, style: {transform: `translateX(${at}px)`},
        position: "static", clip: "none", children: [text]
    }});
    const svg = compileReadmeDemo([frame(0, "", "false"), frame(100, "Hello", "true"),
        frame(200, 'Hello <world>\n"Again"', "true"), frame(300, "Done", "false")], 1000, ":root{color-scheme:light dark}", "");
    assert.match(svg, /@keyframes/);
    assert.match(svg, /content:"Hello <world>\\a \\"Again\\""/);
    assert.match(svg, /clip-path:inset\(100%\)/);
    assert.match(svg, /position:absolute/);
    assert.match(svg, /transform:translateX\(200px\)/);
    assert.match(svg, /<export-text class="t\d+"\/>/);
    assert.match(svg, /prefers-reduced-motion:reduce/);
    assert.match(svg, /color-scheme:light dark/);
    assert.match(svg, /#export\{background:transparent;width:100%;height:auto\}/);
    assert.doesNotMatch(svg, /<script\b|\son\w+=|<iframe\b|(?:src|href)="(?:https?:|\/)/);
});

test("the README export shares repeated styles, animation keyframes, and icons", () => {
    const node = (tag: string) => ({tag, attributes: [] as Array<[string, string]>,
        style: {transform: "none", opacity: "1"}, position: "static", clip: "none", children: [] as string[]});
    const icon = {...node("svg"), children: [{...node("path"), attributes: [
        ["d", "M0 0h10v10Z"], ["fill", "#000"], ["stroke", "#fff"]
    ] as Array<[string, string]>}]};
    const frames = [0, 100].map((at) => ({at, value: {...node("div"), children: [
        {...node("span"), children: [String(at)]}, {...node("span"), children: [String(at)]}, icon, icon
    ]}}));
    const svg = compileReadmeDemo(frames, 1000, "", "");
    assert.equal(svg.match(/@keyframes /g)?.length, 1);
    assert.equal(svg.match(/transform:none;opacity:1;transition:none/g)?.length, 1);
    assert.equal(svg.match(/<path\b/g)?.length, 1);
    assert.match(svg, /<use href="#i\d+"\/>/);
    assert.match(svg, /<path[^>]*fill="#000" stroke="#fff"/);
    assert.match(svg, /#export \.s\d+\{/);
    assert.doesNotMatch(svg, / style="/);
});
