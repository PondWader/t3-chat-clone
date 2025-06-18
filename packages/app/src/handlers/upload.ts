const mimeTypeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpeg"
}

export async function upload(file: Blob, mimeType: string) {
    const formData = new FormData();
    formData.set("file", file)
    formData.set("ext", mimeTypeToExt[mimeType])

    const resp = await fetch(`/api/cdn/upload`, {
        method: 'POST',
        body: formData
    })

    if (!resp.ok) {
        throw new Error('Something unexpected happen');
    }

    const json = await resp.json();
    return `/api/cdn/f/${json.location}`;
}