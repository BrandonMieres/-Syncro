import { ipcMain } from 'electron';
import bcrypt from 'bcrypt';
import { sql } from '../../lib/db.js';
import { getMachineId, generateMacHash } from '../../lib/mac.js';

export function setupAuthHandlers() {
  // --- REGISTER ---
  ipcMain.handle('auth:register', async (event, { username, password }) => {
    try {
      console.log('📝 Register attempt for:', username);
      const mac = await getMachineId();
      const macHash = generateMacHash(mac);

      // 1. Verificar si el usuario ya existe
      const users = await sql('SELECT id FROM users WHERE username = $1', [username]);
      if (users.length > 0) {
        return { success: false, message: 'El nombre de usuario ya está en uso.' };
      }

      // 2. Verificar unicidad global de la MAC
      const macs = await sql('SELECT user_id FROM mac_registry WHERE mac_hash = $1', [macHash]);
      if (macs.length > 0) {
        return { success: false, message: 'Este dispositivo ya está vinculado a otra cuenta.' };
      }

      // 3. Hashear password y MAC (usamos macHash directamente para ahorrar CPU)
      const hashedPassword = await bcrypt.hash(password, 12);

      // 4. Crear usuario (desactivado por defecto)
      // Los 3 slots se inicializan con la MAC del dispositivo de registro (comportamiento intencionado)
      const newUserRes = await sql(
        'INSERT INTO users (username, password, mac1, mac2, mac3, status) VALUES ($1, $2, $3, $3, $3, $4) RETURNING id',
        [username, hashedPassword, macHash, 'desactivado']
      );
      const newUser = newUserRes[0];

      // 5. Registrar MAC globalmente
      await sql(
        'INSERT INTO mac_registry (mac_hash, user_id) VALUES ($1, $2)',
        [macHash, newUser.id]
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { success: false, message: `Error de DB: ${error.message}` };
    }
  });

  // --- LOGIN ---
  ipcMain.handle('auth:login', async (event, data) => {
    try {
      const { username, password } = data;
      console.log('🔑 Login attempt for:', username);
      
      const mac = await getMachineId();
      const macHash = generateMacHash(mac);

      // 1. Buscar usuario
      const users = await sql('SELECT * FROM users WHERE username = $1', [username]);
      if (users.length === 0) {
        return { success: false, message: 'Credenciales incorrectas.' };
      }
      const user = users[0];

      // 2. Verificar password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Credenciales incorrectas.' };
      }

      // 3. Verificar status
      if (user.status !== 'activado') {
        return { success: false, message: 'Tu cuenta está pendiente de activación.' };
      }

      // 4. Verificar si la MAC pertenece a otro usuario (seguridad global)
      const macs = await sql('SELECT user_id FROM mac_registry WHERE mac_hash = $1', [macHash]);
      if (macs.length > 0 && macs[0].user_id !== user.id) {
        return { success: false, message: 'Este dispositivo está vinculado a otra cuenta.' };
      }

      // 5. Comprobar si la MAC ya está en algún slot del usuario → login directo
      const slots = [user.mac1, user.mac2, user.mac3];
      const alreadyRegistered = slots.some(slot => slot && slot === macHash);

      if (alreadyRegistered) {
        console.log('✅ Dispositivo reconocido para:', username);
      } else {
        // 6. Dispositivo nuevo: buscar el primer slot vacío y registrarlo automáticamente
        let slotToUse = null;
        if (!user.mac1) slotToUse = 'mac1';
        else if (!user.mac2) slotToUse = 'mac2';
        else if (!user.mac3) slotToUse = 'mac3';

        if (!slotToUse) {
          return {
            success: false,
            message: 'Límite de dispositivos alcanzado (máximo 3). Contacta con el administrador.'
          };
        }

        // Guardar nueva MAC en el slot libre
        await sql(`UPDATE users SET ${slotToUse} = $1 WHERE id = $2`, [macHash, user.id]);
        
        // Registrar también en mac_registry para la validación global
        if (macs.length === 0) {
          await sql('INSERT INTO mac_registry (mac_hash, user_id) VALUES ($1, $2)', [macHash, user.id]);
        }

        console.log(`✅ Nuevo dispositivo auto-registrado en slot ${slotToUse} para:`, username);
      }

      return { 
        success: true, 
        user: { id: user.id, username: user.username } 
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, message: `Error de conexión/DB: ${error.message}` };
    }
  });
}