export type Message = OkMessage | ErrorMessage;

export const Message = {
  ok: { message: 'ok' },
  error(details: string): ErrorMessage {
    return { message: 'failed', error: details }
  }
}

type OkMessage = {
  message: 'ok';
}

type ErrorMessage = {
  message: 'failed';
  error: string;
}
