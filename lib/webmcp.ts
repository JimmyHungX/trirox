type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function registerTrainingTools(
  summary: () => unknown,
  navigate: (view: string) => void,
) {
  const context = (document as Document & { modelContext?: Context })
    .modelContext;
  if (!context?.registerTool) return;
  const controller = new AbortController();
  const tools: Tool[] = [
    {
      name: 'get_training_summary',
      title: '讀取訓練摘要',
      description:
        'Read today recovery and scheduled workouts. Does not change data.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => summary(),
    },
    {
      name: 'open_training_view',
      title: '開啟訓練頁面',
      description:
        'Navigate to Today, Plan, Analysis or Profile; does not save or modify workouts.',
      inputSchema: {
        type: 'object',
        properties: {
          view: {
            type: 'string',
            enum: ['today', 'plan', 'analysis', 'profile'],
          },
        },
        required: ['view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const view = (input as { view?: unknown })?.view;
        if (
          typeof view !== 'string' ||
          !['today', 'plan', 'analysis', 'profile'].includes(view)
        )
          throw new Error('Invalid view');
        navigate(view);
        return { view };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported browser contexts leave normal navigation available. */
    }
  }
  return () => controller.abort();
}
