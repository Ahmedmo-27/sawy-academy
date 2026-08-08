interface ValidationIssue {
  path: string[];
  message: string;
}

interface ValidationError {
  issues: ValidationIssue[];
}

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

interface Schema<T> {
  safeParse: (value: unknown) => ValidationResult<T>;
}

type StringRecord = Record<string, unknown>;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_URL_PATTERN = /^https?:\/\/.+/i;

function record(value: unknown): StringRecord {
  return value && typeof value === "object" ? (value as StringRecord) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function schema<T>(
  validate: (value: StringRecord, issues: ValidationIssue[]) => T
): Schema<T> {
  return {
    safeParse(input) {
      const issues: ValidationIssue[] = [];
      const data = validate(record(input), issues);
      return issues.length
        ? { success: false, error: { issues } }
        : { success: true, data };
    },
  };
}

function issue(issues: ValidationIssue[], path: string, message: string) {
  issues.push({ path: [path], message });
}

export const contactSchema = schema((value, issues) => {
  const data = {
    name: text(value.name),
    email: text(value.email),
    subject: text(value.subject),
    message: text(value.message),
  };
  if (!data.name) issue(issues, "name", "Name is required.");
  if (!EMAIL_PATTERN.test(data.email)) issue(issues, "email", "Enter a valid email address.");
  if (!data.subject) issue(issues, "subject", "Select a service type.");
  if (data.message.length < 10) issue(issues, "message", "Please add a little more detail.");
  return data;
});

export const loginSchema = schema((value, issues) => {
  const data = { email: text(value.email), password: typeof value.password === "string" ? value.password : "" };
  if (!EMAIL_PATTERN.test(data.email)) issue(issues, "email", "Enter a valid email address.");
  if (!data.password) issue(issues, "password", "Password is required.");
  return data;
});

export const signupSchema = schema((value, issues) => {
  const data = {
    name: text(value.name),
    email: text(value.email),
    password: typeof value.password === "string" ? value.password : "",
    confirmPassword: typeof value.confirmPassword === "string" ? value.confirmPassword : "",
  };
  if (data.name.length < 2) issue(issues, "name", "Enter your full name.");
  if (!EMAIL_PATTERN.test(data.email)) issue(issues, "email", "Enter a valid email address.");
  if (data.password.length < 8) issue(issues, "password", "Password must be at least 8 characters.");
  if (data.password !== data.confirmPassword) issue(issues, "confirmPassword", "Passwords do not match.");
  return data;
});

export const designRequestSchema = schema((value, issues) => {
  if (!text(value.name)) issue(issues, "name", "Full name is required.");
  if (!EMAIL_PATTERN.test(text(value.email))) issue(issues, "email", "Enter a valid email address.");
  if (!text(value.projectType)) issue(issues, "projectType", "Select a project type.");
  if (!text(value.scopeOfWork)) issue(issues, "scopeOfWork", "Describe what should be designed.");
  return value;
});

export const researchRequestSchema = schema((value, issues) => {
  if (!text(value.name)) issue(issues, "name", "Full name is required.");
  if (!EMAIL_PATTERN.test(text(value.email))) issue(issues, "email", "Enter a valid email address.");
  if (!text(value.interestType)) issue(issues, "interestType", "Select a type of interest.");
  if (value.interestType === "collaborate-existing" && !text(value.linkedResearchId)) {
    issue(issues, "linkedResearchId", "Select an existing research entry.");
  }
  if (!text(value.researchAreaOrTopic)) issue(issues, "researchAreaOrTopic", "Describe the research area or topic.");
  if (text(value.backgroundCvLink) && !HTTP_URL_PATTERN.test(text(value.backgroundCvLink))) {
    issue(issues, "backgroundCvLink", "Enter a valid URL.");
  }
  return value;
});

export const checkoutSchema = schema((value, issues) => {
  const data = { screenshotUrl: text(value.screenshotUrl) };
  if (!HTTP_URL_PATTERN.test(data.screenshotUrl)) {
    issue(issues, "screenshotUrl", "Upload an InstaPay payment screenshot to continue.");
  }
  return data;
});

export function issuesByField(error: ValidationError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}
