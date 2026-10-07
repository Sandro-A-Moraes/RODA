export type ErrorCode =
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'not_found'
  | 'conflict'
  | 'unknown';

export interface AppError {
  code: ErrorCode;
  message: string;
}

const defaultMessages: Record<ErrorCode, string> = {
  network: 'Sem conexão. Verifique sua internet e tente novamente.',
  validation: 'Dados inválidos. Revise as informações e tente novamente.',
  unauthorized: 'Você precisa entrar para continuar.',
  not_found: 'Não encontramos o que você procura.',
  conflict: 'Essa ação conflita com o estado atual. Tente novamente.',
  unknown: 'Algo deu errado. Tente novamente.',
};

export function createAppError(code: ErrorCode, message?: string): AppError {
  return { code, message: message ?? defaultMessages[code] };
}
