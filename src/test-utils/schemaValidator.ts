import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const taskSchema = {
  type: "object",
  required: ["id", "title", "status", "type", "externalRef", "ownerId", "version", "runId", "createdAt", "updatedAt"],
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    status: { enum: ["todo", "in_progress", "done"] },
    type: { enum: ["feature", "bug", "chore"] },
    externalRef: { type: "string" },
    ownerId: { type: "integer" },
    version: { type: "integer" },
    runId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const listSchema = {
  type: "object",
  required: ["items", "total", "page", "limit"],
  properties: {
    items: { type: "array", items: taskSchema },
    total: { type: "integer" },
    page: { type: "integer" },
    limit: { type: "integer" },
  },
};

const validators = {
  task: ajv.compile(taskSchema),
  taskList: ajv.compile(listSchema),
};

export function assertSchema(name: keyof typeof validators, data: unknown): void {
  const validate = validators[name];
  if (!validate(data)) {
    const details = (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`).join("; ");
    throw new Error(`Schema validation failed for ${name}: ${details}`);
  }
}
