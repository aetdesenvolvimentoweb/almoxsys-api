/**
 * Obtém a porta do servidor a partir de variável de ambiente ou padrão.
 */
export function getServerPort(): number {
  const portEnv = process.env["PORT"];
  return portEnv ? parseInt(portEnv, 10) : 3000;
}
