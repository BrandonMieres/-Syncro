import pkg from 'node-machine-id';
const { machineId } = pkg;
import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Obtiene el ID único de la máquina (MAC Address abstracta)
 */
export async function getMachineId() {
  try {
    return await machineId();
  } catch (error) {
    console.error('Error obteniendo Machine ID:', error);
    return 'fallback-id-' + process.platform;
  }
}

/**
 * Genera un hash determinista (no saltado) para el registro global
 */
export function generateMacHash(mac) {
  return crypto.createHash('sha256').update(mac).digest('hex');
}

/**
 * Genera un hash bcrypt para una MAC (con salt)
 */
export async function hashMac(mac) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(mac, salt);
}

/**
 * Compara una MAC con su hash bcrypt
 */
export async function verifyMac(mac, hash) {
  if (!hash) return false;
  return await bcrypt.compare(mac, hash);
}
