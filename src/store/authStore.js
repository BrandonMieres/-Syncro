import { create } from 'zustand';

export const useAuthStore = create((set, get) => {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    rememberMe: localStorage.getItem('rememberMe') === 'true',

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),
    
    setRememberMe: (val) => {
      localStorage.setItem('rememberMe', val);
      if (!val) {
        localStorage.removeItem('saved_credentials');
      }
      set({ rememberMe: val });
    },

    login: (user, credentials = null) => {
      // Guardar el usuario para el perfil
      localStorage.setItem('saved_user', JSON.stringify(user));
      
      // Solo persistir credenciales si "Recordar sesión" está activo
      const rememberMe = get().rememberMe;
      if (rememberMe && credentials) {
        localStorage.setItem('saved_credentials', JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }));
      } else if (!rememberMe) {
        // Limpiar credenciales anteriores si no se quiere recordar
        localStorage.removeItem('saved_credentials');
      }

      set({ user, isAuthenticated: true, isLoading: false, error: null });
    },

    logout: () => {
      // Al cerrar sesión, quitamos la autenticación.
      // Las credenciales se mantienen si rememberMe está activo (para el autofill del siguiente login)
      set({ user: null, isAuthenticated: false });
    },
  };
});