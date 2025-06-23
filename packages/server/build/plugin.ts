import { BunPlugin } from "bun";
import { keyHandler } from "../instances";

// Injects a static web app config into index.html
const plugin: BunPlugin = {
    name: "config-loader",
    setup(build) {
        build.onLoad({ filter: /.html$/ }, async (m) => {
            const config = {
                groqEnabled: keyHandler.hasKey('Groq'),
                openRouterEnabled: keyHandler.hasKey('OpenRouter')
            }

            const rewriter = new HTMLRewriter();
            rewriter.on('body', {
                element(el) {
                    el.append(`<script>window.config = ${JSON.stringify(config)}</script>`, { html: true })
                }
            })

            const fileContent = await Bun.file(m.path).text();
            const result = rewriter.transform(fileContent);

            return {
                contents: result,
                loader: "html"
            }
        })
    }
}

export default plugin;