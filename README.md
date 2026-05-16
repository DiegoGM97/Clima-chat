# Clima Chat
Aplicación web que combina datos meteorológicos en tiempo real con una interfaz de chat conversacional. Permite consultar el clima de cualquier ciudad de forma rápida e intuitiva.
## Funcionalidades
- Consulta el clima actual por ciudad
- Interfaz conversacional para buscar ubicaciones
- Historial de conversaciones persistente con Supabase
- Diseño responsive para desktop y móvil
- Actualizaciones en tiempo real de condiciones climáticas
## Tecnologías
- **Frontend:** Next.js 14, React, TypeScript
- **Estilos:** Tailwind CSS
- **API Climática:** OpenWeather API
- **Base de datos:** Supabase (historial de chat)
- **Deploy:** Vercel
## Implementación
1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Crear archivo `.env.local` con las variables:
   - `OPENWEATHER_API_KEY` - clave de OpenWeather API
   - `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - clave anónima de Supabase
4. Ejecutar `npm run dev`
5. Abrir `http://localhost:3000`
## Demo
[clima-chat.vercel.app](https://clima-chat.vercel.app)
