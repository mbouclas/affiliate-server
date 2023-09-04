import { HttpException, HttpStatus } from "@nestjs/common";

export class CouldNotGeneratePreviewUrlHttpException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.SEE_OTHER);
  }
}
