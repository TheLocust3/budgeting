export type NotFound = { _type: "NotFound" }
export const throwNotFound: FrontendError = { _type: "NotFound" }

export type InternalError = { _type: "InternalError" }
export const throwInternalError: FrontendError = { _type: "InternalError" }

export type FrontendError = NotFound | InternalError
