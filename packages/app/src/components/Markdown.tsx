import { Renderer, Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { useMemo } from "preact/hooks";

// Escape all HTML
Renderer.prototype.html = function ({ text }) {
    return htmlEscape(text);
}

const marked = new Marked(
    markedHighlight({
        highlight
    })
);

export default function Markdown(props: { children: string }) {
    const markdown = useMemo(() => marked.parse(props.children) as string, [props.children]);

    return <span class="prose dark:prose-invert" dangerouslySetInnerHTML={{
        __html: markdown.trim()
    }}></span>
}

const highlightedLangs = ["py", "python", "js", "javasript", "typescript", "ts", "go", "golang", "java", "jsx", "tsx", "json", "c", "cpp", "ruby", "php", "bash", "sql", "html", "css"];

const highlightTheme = {
    var: "text-blue-500",
    func: "text-blue-500",
    ident: "text-blue-300",
    number: "text-lime-400",
    string: "text-amber-600",
    bool: "text-rose-400"
}

const varKeywords = ["var", "let", "const"];
const funcKeywords = ["fn", "func", "function"];
const boolKeywords = ["true", "false", "True", "False"]
const stringQuotes = ['"', "'", "`"];

/**
 * Very minimal code highlighter
 */
function highlight(code: string, lang: string) {
    if (!highlightedLangs.includes(lang.toLowerCase())) return code;

    let out = '';
    let isIdentifier = false;
    let isNumber = false;
    let isString = false;
    let stringQuote = '';
    let currentIdent = '';
    for (const c of code) {
        if (isString) {
            out += c;
            if (c === stringQuote) {
                out += `</span>`;
                isString = false;
            }
            continue;
        }

        if (c.match(/[a-zA-Z]|\$|_/)) {
            isIdentifier = true;
            currentIdent += c;
        } else if (c.match(/[0-9]/)) {
            currentIdent += c;
            if (isIdentifier) continue;
            isNumber = true;
        } else {
            if (isNumber) {
                out += `<span class="${highlightTheme.number}">${currentIdent}</span>`
            } else {
                if (varKeywords.includes(currentIdent))
                    out += `<span class="${highlightTheme.var}">${currentIdent}</span>`
                else if (funcKeywords.includes(currentIdent))
                    out += `<span class="${highlightTheme.func}">${currentIdent}</span>`
                else if (boolKeywords.includes(currentIdent))
                    out += `<span class="${highlightTheme.bool}">${currentIdent}</span>`
                else
                    out += `<span class="${highlightTheme.ident}">${currentIdent}</span>`
            }

            if (stringQuotes.includes(c)) {
                isString = true;
                out += `<span class="${highlightTheme.string}">`;
                stringQuote = c;
            }

            out += c;
            currentIdent = '';
        }
    }
    return out;
}

function htmlEscape(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}