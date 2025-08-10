export type Run = {
  id: string;
  testId: string;
  agentName: string;
  startedAt: Date;
  finishedAt?: Date;
  success?: boolean;
};
