import { v5 as uuidv5 } from 'uuid';

export const rootPath = `meta`;
export const hash = (value: string) => uuidv5(value, uuidv5.URL);
