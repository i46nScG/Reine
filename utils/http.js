import { HttpStatus, JsonHeaders } from "./constants.js";

export function json(data, status = HttpStatus.OK) {
    return new Response(JSON.stringify(data), {
        status,
        headers: JsonHeaders,
    });
}

export function notFound() {
    return json({ error: "Couldn't find anything" }, HttpStatus.NOT_FOUND);
}

export function methodNotAllowed() {
    return json(
        { error: "What are you doing here? You won't find anything" },
        HttpStatus.METHOD_NOT_ALLOWED,
    );
}
