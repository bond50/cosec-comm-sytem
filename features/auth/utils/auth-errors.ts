import "server-only";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class MissingOrganizationError extends Error {
  constructor(message = "Active organization required") {
    super(message);
    this.name = "MissingOrganizationError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
