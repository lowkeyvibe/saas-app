# Configurar este proyecto en una compu nueva

Instrucciones para dejar `saas-app` listo para trabajar en otra compu.
Si sos Claude: hacé todos los pasos en orden. Cuando un paso necesite al usuario (login o archivos con claves), frená y explicale qué tiene que hacer.

Repo: https://github.com/lowkeyvibe/saas-app (privado)

## 1. Herramientas

- **Git**: comprobá con `git --version`. En Mac, si no está, corré `xcode-select --install`.
- **GitHub CLI (`gh`)**: comprobá con `gh --version`. En Mac, si no está, corré `brew install gh`.
- **Node.js**: solo hace falta si el proyecto tiene un `package.json`. Comprobá con `node --version`. Si falta, instalá la versión LTS con `brew install node`.

## 2. Iniciar sesión en GitHub

Comprobá con `gh auth status`. Si no hay sesión iniciada:

```
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

El primer comando muestra un código de un solo uso. El usuario tiene que abrir https://github.com/login/device, pegar el código y autorizar.

## 3. Bajar el proyecto

Si todavía no está clonado:

```
gh repo clone lowkeyvibe/saas-app
cd saas-app
```

Si ya está clonado, entrá a la carpeta y corré `git pull`.

## 4. Variables de entorno (.env)

Los archivos `.env*` **no están en GitHub** (el `.gitignore` los excluye a propósito, porque tienen claves).

- Si existe un `.env.example`, copialo: `cp .env.example .env.local`.
- Pedile al usuario los valores reales. Los tiene que traer de la otra compu o del panel de cada servicio.
- **Nunca** subas un `.env` con claves reales.

## 5. Instalar dependencias

Solo si existe un `package.json`:

```
npm install
```

(Si hay `pnpm-lock.yaml` usá `pnpm install`, y si hay `yarn.lock`, `yarn`.)

Para comprobar que funciona, corré `npm run dev` si ese script existe.

## 6. Cómo trabajar todos los días

- **Antes de empezar:** `git pull`
- **Al terminar:**
  ```
  git add .
  git commit -m "descripción de lo que hiciste"
  git push
  ```

Hacé siempre el push antes de cambiar de compu. Si no, los cambios quedan solo en la compu donde los hiciste.
