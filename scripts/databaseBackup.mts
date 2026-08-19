import nextEnv from "@next/env";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(filename), "..");

nextEnv.loadEnvConfig(projectRoot);

const [command, ...args] = process.argv.slice(2);

main();

function main() {
  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "dump") {
    dumpDatabase(args);
    return;
  }

  if (command === "restore") {
    restoreDatabase(args);
    return;
  }

  fail(`Unknown command: ${command}`);
}

function dumpDatabase(commandArgs: string[]) {
  if (commandArgs.length > 1) {
    fail("dump accepts at most one output file path.");
  }

  const databaseUri = getRequiredEnv("DATABASE_URI");
  const outputPath = path.resolve(
    projectRoot,
    commandArgs[0] ?? path.join("backups", `database-${timestamp()}.dump`),
  );

  if (existsSync(outputPath)) {
    fail(`Output file already exists: ${outputPath}`);
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log(`Dumping ${describeDatabase(databaseUri)}`);
  runPostgresCommand(
    "pg_dump",
    ["--format=custom", "--no-owner", "--no-privileges", "--file", outputPath],
    databaseUri,
  );
  console.log(`Database dump created: ${outputPath}`);
}

function restoreDatabase(commandArgs: string[]) {
  const confirmed = commandArgs.includes("--confirm");
  const positionalArgs = commandArgs.filter((arg) => arg !== "--confirm");

  if (positionalArgs.length !== 1) {
    fail("restore requires exactly one dump file path.");
  }
  if (!confirmed) {
    fail(
      "Restore replaces data in the target database. Re-run with --confirm after checking TARGET_DATABASE_URI.",
    );
  }

  const sourceDatabaseUri = getRequiredEnv("DATABASE_URI");
  const targetDatabaseUri = getRequiredEnv("TARGET_DATABASE_URI");
  if (
    normalizeDatabaseUri(sourceDatabaseUri) ===
    normalizeDatabaseUri(targetDatabaseUri)
  ) {
    fail("TARGET_DATABASE_URI must be different from DATABASE_URI.");
  }

  const dumpPath = path.resolve(projectRoot, positionalArgs[0]);
  if (!existsSync(dumpPath) || !statSync(dumpPath).isFile()) {
    fail(`Dump file not found: ${dumpPath}`);
  }

  // Validate that pg_restore can read the archive before modifying the target.
  runPostgresCommand("pg_restore", ["--list", dumpPath], undefined, true);

  console.log(`Restoring into ${describeDatabase(targetDatabaseUri)}`);
  const targetConnection = getPostgresConnection(targetDatabaseUri);
  runPostgresCommand(
    "pg_restore",
    [
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      "--single-transaction",
      "--dbname",
      targetConnection.database,
      dumpPath,
    ],
    targetDatabaseUri,
  );
  console.log(
    `Database restore completed: ${describeDatabase(targetDatabaseUri)}`,
  );
}

function runPostgresCommand(
  executable: string,
  commandArgs: string[],
  databaseUri?: string,
  discardOutput = false,
) {
  const connectionEnv = databaseUri
    ? getPostgresConnection(databaseUri).env
    : {};
  const result = spawnSync(executable, commandArgs, {
    env: { ...process.env, ...connectionEnv },
    stdio: discardOutput ? ["ignore", "ignore", "inherit"] : "inherit",
  });

  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === "ENOENT") {
      fail(
        `${executable} was not found. Install PostgreSQL client tools and make sure ${executable} is on PATH.`,
      );
    }
    throw result.error;
  }
  if (result.status !== 0) {
    fail(`${executable} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function getRequiredEnv(name: "DATABASE_URI" | "TARGET_DATABASE_URI") {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`${name} is not set.`);
  }
  return value;
}

function normalizeDatabaseUri(value: string) {
  try {
    const url = new URL(value);
    return [
      url.hostname.toLowerCase(),
      url.port || "5432",
      decodeURIComponent(url.username),
      decodeURIComponent(url.pathname.replace(/^\//, "")),
    ].join("\n");
  } catch {
    return value;
  }
}

function getPostgresConnection(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail("Database URI is invalid.");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    fail("Database URI must use the postgres:// or postgresql:// scheme.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !database) {
    fail("Database URI must include a host and database name.");
  }

  const env: Record<string, string> = {
    PGDATABASE: database,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
  };
  if (url.username) env.PGUSER = decodeURIComponent(url.username);
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);

  const libpqOptions: Record<string, string> = {
    application_name: "PGAPPNAME",
    channel_binding: "PGCHANNELBINDING",
    connect_timeout: "PGCONNECT_TIMEOUT",
    options: "PGOPTIONS",
    sslcert: "PGSSLCERT",
    sslkey: "PGSSLKEY",
    sslmode: "PGSSLMODE",
    sslrootcert: "PGSSLROOTCERT",
  };
  for (const [queryName, envName] of Object.entries(libpqOptions)) {
    const optionValue = url.searchParams.get(queryName);
    if (optionValue) env[envName] = optionValue;
  }

  return { database, env };
}

function describeDatabase(value: string) {
  try {
    const url = new URL(value);
    const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
    return `${url.hostname}:${url.port || "5432"}/${databaseName}`;
  } catch {
    return "the configured database";
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function printUsage() {
  console.log(`Usage:
  npm run db:dump -- [output-file]
  npm run db:restore -- <dump-file> --confirm

Environment:
  DATABASE_URI         Source database used by dump
  TARGET_DATABASE_URI  Destination database used by restore`);
}

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}
