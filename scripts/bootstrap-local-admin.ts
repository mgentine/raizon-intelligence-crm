import { provisionLocalAdmin } from "../server/db";
import { localAuthLoginFromEnv, localAuthPasswordFromEnv } from "../server/localAuth";

const loginId = localAuthLoginFromEnv();
const password = localAuthPasswordFromEnv();

if (!loginId || !password) {
  throw new Error("LOCAL_AUTH_ADMIN_LOGIN e LOCAL_AUTH_ADMIN_PASSWORD são obrigatórios.");
}

const userId = await provisionLocalAdmin(loginId, password);
console.log(`Administrador local provisionado: userId=${userId}, loginId=${loginId}`);
process.exit(0);
