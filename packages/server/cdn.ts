import fs from "node:fs";

const CDN_DIRECTORY = process.env.CDN_DIRECTORY || './user_content';

if (!fs.existsSync(CDN_DIRECTORY)) {
    fs.mkdirSync(CDN_DIRECTORY);
}

export function createCdn() {
    return {
        async load(req: Bun.BunRequest<`${string}/:name`>) {
            const name = req.params.name;
            if (!name.match(/([a-zA-Z]|.)+/)) {
                return new Response(null, { status: 400 });
            }
            const f = Bun.file(`${CDN_DIRECTORY}/${req.params.name}`);
            if (!(await f.exists())) return new Response('404 Not Found', { status: 404 });
            return new Response(f);
        },
        async upload(req: Bun.BunRequest) {
            const form = await req.formData();
            const f = form.get('file');
            const ext = form.get('ext');
            if (f === null || ext === null) return new Response(null, { status: 400 });

            if (ext.toString().length > 5 || !ext.toString().match(/[a-zA-Z]+/)) {
                return new Response(null, { status: 400 });
            }

            const fileId = Bun.randomUUIDv7();
            await Bun.write(`${CDN_DIRECTORY}/${fileId}.${ext}`, f);
            return Response.json({
                location: `${fileId}.${ext}`
            });
        }
    }
}