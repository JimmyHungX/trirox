import { env } from 'cloudflare:workers';
import { firstUseState, type AppState } from '@/lib/training';
import { validState } from '@/lib/validation';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  try {
    const requestedDate = new URL(request.url).searchParams.get('date');
    const localDate =
      requestedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
      Number.isFinite(Date.parse(requestedDate))
        ? requestedDate
        : undefined;
    const row = await env.DB.prepare(
      'SELECT payload, revision FROM athlete_state WHERE id = ?',
    )
      .bind('owner')
      .first<{ payload: string; revision: number }>();
    return Response.json(
      row
        ? { state: JSON.parse(row.payload), revision: row.revision }
        : { state: firstUseState(localDate), revision: -1 },
      { headers },
    );
  } catch {
    return Response.json(
      { error: '暫時無法讀取紀錄，請稍後重試。' },
      { status: 503, headers },
    );
  }
}
export async function PUT(request: Request) {
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return Response.json({ error: '不允許此來源。' }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 1500000)
      return Response.json(
        { error: '紀錄太大，請先匯出備份。' },
        { status: 413 },
      );
    const { state, revision } = JSON.parse(text) as {
      state: AppState;
      revision: number;
    };
    if (!validState(state) || !Number.isInteger(revision) || revision < -1)
      return Response.json({ error: '紀錄格式不正確。' }, { status: 400 });
    const query =
      revision === -1
        ? env.DB.prepare(
            'INSERT OR IGNORE INTO athlete_state (id, payload, revision, updated_at) VALUES (?, ?, ?, ?)',
          ).bind('owner', JSON.stringify(state), 0, new Date().toISOString())
        : env.DB.prepare(
            'UPDATE athlete_state SET payload = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?',
          ).bind(
            JSON.stringify(state),
            revision + 1,
            new Date().toISOString(),
            'owner',
            revision,
          );
    const result = await query.run();
    if (!result.meta.changes)
      return Response.json(
        { error: '其他視窗已更新紀錄，請重新整理後再試。' },
        { status: 409 },
      );
    return Response.json({ revision: revision + 1 }, { headers });
  } catch {
    return Response.json(
      { error: '儲存失敗，請保留畫面後重試。' },
      { status: 503 },
    );
  }
}
