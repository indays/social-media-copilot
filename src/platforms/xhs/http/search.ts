import request from "./request";

export function searchNotes(params: { keyword: string; startTime?: string; endTime?: string; page: number; pageSize: number }) {
    return request.get('/api/sns/web/v1/search/notes', { params });
}
