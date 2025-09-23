# CELO Mexico Website

Sitio web oficial de CELO Mexico - El hub para builders y comunidad en México.

## 🚀 Características

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Privy** para autenticación de wallets
- **Prisma** para base de datos
- **Responsive Design** optimizado para móviles

## 📁 Estructura del Proyecto

```
├── app/                    # App Router de Next.js 14
│   ├── (site)/            # Rutas públicas del sitio
│   │   ├── academy/       # Página de academia
│   │   ├── marketplace/   # Marketplace de NFTs
│   │   └── page.tsx       # Página principal
│   ├── api/               # API routes
│   ├── dashboard/         # Panel de administración
│   └── ramps/             # On-ramp de criptomonedas
├── components/            # Componentes reutilizables
│   ├── academy/          # Componentes específicos de academia
│   ├── marketplace/      # Componentes del marketplace
│   └── ui/               # Componentes base de UI
├── lib/                  # Utilidades y configuración
├── public/               # Archivos estáticos
│   ├── fonts/           # Fuentes optimizadas
│   └── icons/           # Iconos SVG
└── prisma/              # Esquema de base de datos
```

## 🛠️ Setup del Proyecto

### Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm
- Git

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/CeloMexico/celomxwebsite.git
   cd celomxwebsite
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` con tus configuraciones:
   ```env
   # Privy
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Otros servicios...
   ```

4. **Configurar base de datos**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Ejecutar en desarrollo**
   ```bash
   pnpm dev
   ```

   El sitio estará disponible en [http://localhost:3000](http://localhost:3000)

## 🎨 Assets Externos

Este proyecto utiliza assets externos para optimizar el tamaño del repositorio:

- **Videos**: Alojados en Cloudinary
- **Imágenes**: Alojadas en PostImg
- **Fuentes**: Solo las esenciales en `public/fonts/`

## 📱 Páginas Principales

- **Home** (`/`): Página principal con hero, características y posters
- **Academy** (`/academy`): Cursos y programas de desarrollo
- **Marketplace** (`/marketplace`): NFTs y colecciones
- **Dashboard** (`/dashboard`): Panel de administración
- **Ramps** (`/ramps`): On-ramp de criptomonedas

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check

# Base de datos
pnpm prisma studio    # Abrir Prisma Studio
pnpm prisma generate  # Generar cliente Prisma
pnpm prisma db push   # Sincronizar esquema
```

## 🎯 Tecnologías Utilizadas

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Animaciones**: Framer Motion
- **Autenticación**: Privy
- **Base de datos**: Prisma + SQLite
- **Deployment**: Vercel (recomendado)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**CELO Mexico** - Construyendo el futuro de las finanzas descentralizadas en México 🇲🇽# Trigger redeploy
