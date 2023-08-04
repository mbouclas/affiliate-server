import { BaseException } from "~root/exceptions/base.exception";

export class InvalidCredentialsException extends BaseException {}
export class UserNotFoundException extends BaseException {}
export class UserNotActiveException extends BaseException {}
