# Express + MongoDB Contacts API

🇫🇷 [Français](#-français) · 🇬🇧 [English](#-english)

---

# 🇫🇷 Français

API REST de gestion de contacts (CRUD) avec **Node.js**, **Express** et **MongoDB**.
Le fichier `index.js` est entièrement commenté : il sert de support pour le cours de services web.

> ⚠️ **Version pédagogique (v1).** Ce code n'est pas prêt pour la production : il n'y a ni validation des données, ni authentification, et CORS est ouvert à toutes les origines. Ces limites sont volontaires et font l'objet d'exercices (voir [Pour aller plus loin](#pour-aller-plus-loin)).

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.js` | Le serveur : connexion à MongoDB, 5 routes CRUD, démarrage |
| `package.json` | Dépendances et configuration du projet (à créer, voir ci-dessous) |
| `README.md` | Ce guide |

## Prérequis

- [Node.js](https://nodejs.org/) (version LTS recommandée)
- [MongoDB Community Server](https://www.mongodb.com/docs/manual/installation/) lancé en local sur le port `27017` (port par défaut)
- Un outil pour tester l'API : `curl`, [Postman](https://www.postman.com/) ou l'extension VS Code « Thunder Client »

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-compte>/<nom-du-depot>.git
cd <nom-du-depot>

# 2. Initialiser le projet (si package.json n'existe pas encore)
npm init -y

# 3. Activer les modules ES (OBLIGATOIRE, voir remarque ci-dessous)
npm pkg set type=module

# 4. Installer les dépendances
npm install express mongodb cors
```

> **Pourquoi `"type": "module"` ?** Le code utilise `import ... from` et un `await` au niveau racine du fichier. Ces deux fonctionnalités n'existent que dans les modules ES. Sans cette ligne dans `package.json`, Node.js affiche une erreur de syntaxe. Voir la [documentation Node.js](https://nodejs.org/api/esm.html).

## Lancer le serveur

1. Vérifiez que MongoDB est démarré.
2. Lancez :

```bash
node index.js
```

Vous devez voir :

```
Connected to MongoDB
Server running on http://localhost:3000
```

Si la connexion échoue, le programme s'arrête avec le message `Database connection failed` : vérifiez que MongoDB tourne.

La base `DBContact` et la collection `contacts` sont créées automatiquement à la première insertion.

## Les routes

| Méthode | Route | Action | Réponses possibles |
|---|---|---|---|
| `POST` | `/new_contact` | Créer un contact | `201`, `500` |
| `GET` | `/contacts` | Lister tous les contacts | `200`, `500` |
| `GET` | `/contacts/:id` | Lire un contact | `200`, `404`, `400` |
| `PUT` | `/modify_contact/:id` | Modifier un contact | `200`, `404`, `400` |
| `DELETE` | `/delete_contact/:id` | Supprimer un contact | `200`, `404`, `400` |

Le contact est un document JSON libre, par exemple :

```json
{ "name": "Sara", "phone": "12345678", "email": "sara@example.com" }
```

## Exemples de requêtes (curl)

Remplacez `<id>` par l'identifiant renvoyé à la création.

```bash
# Créer un contact
curl -X POST http://localhost:3000/new_contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Sara","phone":"12345678"}'

# Lister tous les contacts
curl http://localhost:3000/contacts

# Lire un contact
curl http://localhost:3000/contacts/<id>

# Modifier un contact (seuls les champs envoyés changent)
curl -X PUT http://localhost:3000/modify_contact/<id> \
  -H "Content-Type: application/json" \
  -d '{"phone":"87654321"}'

# Supprimer un contact
curl -X DELETE http://localhost:3000/delete_contact/<id>
```

> 💡 **Windows :** dans l'invite de commandes (`cmd`), les guillemets simples ne fonctionnent pas et les `\` de fin de ligne non plus. Utilisez Postman, ou écrivez la commande sur une seule ligne avec des guillemets doubles échappés (`-d "{\"name\":\"Sara\"}"`).

## Concepts à retenir

- **`find()` vs `findOne()`** : `find()` renvoie un *curseur* sur tous les documents correspondants (il faut `.toArray()` pour obtenir un tableau ; tableau vide s'il n'y a aucun résultat). `findOne()` renvoie directement *le premier document* trouvé, ou `null`.
  Docs : [find](https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/) · [findOne](https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/)
- **`ObjectId`** : l'`_id` de MongoDB n'est pas une simple chaîne. Il faut convertir l'id reçu dans l'URL avec `new ObjectId(...)`. Un id mal formé déclenche une exception, d'où le code `400`.
- **`$set`** : met à jour uniquement les champs fournis, sans toucher aux autres.
- **Codes HTTP** : `201` création, `400` requête invalide, `404` introuvable, `500` erreur serveur. Voir [MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/Status).

## Pour aller plus loin

Exercices proposés (limites connues de cette version) :

1. **Valider les entrées** avec [zod](https://zod.dev/) ou [joi](https://joi.dev/) et n'accepter qu'une liste de champs (`name`, `phone`, `email`). Aujourd'hui, `req.body` est inséré tel quel. Voir [injection NoSQL (OWASP)](https://owasp.org/www-community/attacks/NoSQL_injection).
2. **Corriger la conception REST** : remplacer `/new_contact`, `/modify_contact/:id`, `/delete_contact/:id` par `POST /contacts`, `PUT`/`PATCH /contacts/:id`, `DELETE /contacts/:id`. Voir le [guide Microsoft](https://learn.microsoft.com/fr-fr/azure/architecture/best-practices/api-design).
3. **Externaliser la configuration** (`mongoUrl`, `PORT`) dans des variables d'environnement (`process.env`, fichier `.env`).
4. **Restreindre CORS** à des origines précises.
5. **Ajouter une recherche** par nom (`find` avec un filtre) et une **pagination** (`skip`, `limit`).
6. **Séparer le code** en routes, contrôleurs et accès aux données.

## Licence

À compléter (par exemple [MIT](https://choosealicense.com/licenses/mit/)).

---

# 🇬🇧 English

A REST API for contact management (CRUD) built with **Node.js**, **Express** and **MongoDB**.
The `index.js` file is fully commented (in French) and is used as course material for a web services class.

> ⚠️ **Teaching version (v1).** This code is not production-ready: there is no input validation, no authentication, and CORS is open to all origins. These limitations are intentional and are the basis of the exercises (see [Going further](#going-further)).

## Repository contents

| File | Purpose |
|---|---|
| `index.js` | The server: MongoDB connection, 5 CRUD routes, startup |
| `package.json` | Project dependencies and configuration (to be created, see below) |
| `README.md` | This guide |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MongoDB Community Server](https://www.mongodb.com/docs/manual/installation/) running locally on the default port `27017`
- A tool to test the API: `curl`, [Postman](https://www.postman.com/) or the VS Code "Thunder Client" extension

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-account>/<repo-name>.git
cd <repo-name>

# 2. Initialize the project (if package.json does not exist yet)
npm init -y

# 3. Enable ES modules (REQUIRED, see note below)
npm pkg set type=module

# 4. Install dependencies
npm install express mongodb cors
```

> **Why `"type": "module"`?** The code uses `import ... from` and a top-level `await`. Both are only available in ES modules. Without this setting in `package.json`, Node.js throws a syntax error. See the [Node.js docs](https://nodejs.org/api/esm.html).

## Run the server

1. Make sure MongoDB is running.
2. Start the server:

```bash
node index.js
```

You should see:

```
Connected to MongoDB
Server running on http://localhost:3000
```

If the connection fails, the program exits with `Database connection failed`: check that MongoDB is running.

The `DBContact` database and the `contacts` collection are created automatically on the first insert.

## Routes

| Method | Route | Action | Possible responses |
|---|---|---|---|
| `POST` | `/new_contact` | Create a contact | `201`, `500` |
| `GET` | `/contacts` | List all contacts | `200`, `500` |
| `GET` | `/contacts/:id` | Read one contact | `200`, `404`, `400` |
| `PUT` | `/modify_contact/:id` | Update a contact | `200`, `404`, `400` |
| `DELETE` | `/delete_contact/:id` | Delete a contact | `200`, `404`, `400` |

A contact is a free-form JSON document, for example:

```json
{ "name": "Sara", "phone": "12345678", "email": "sara@example.com" }
```

## Request examples (curl)

Replace `<id>` with the identifier returned when the contact was created.

```bash
# Create a contact
curl -X POST http://localhost:3000/new_contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Sara","phone":"12345678"}'

# List all contacts
curl http://localhost:3000/contacts

# Read one contact
curl http://localhost:3000/contacts/<id>

# Update a contact (only the fields you send are changed)
curl -X PUT http://localhost:3000/modify_contact/<id> \
  -H "Content-Type: application/json" \
  -d '{"phone":"87654321"}'

# Delete a contact
curl -X DELETE http://localhost:3000/delete_contact/<id>
```

> 💡 **Windows:** in the Command Prompt (`cmd`), single quotes and trailing `\` line continuations do not work. Use Postman, or write the command on one line with escaped double quotes (`-d "{\"name\":\"Sara\"}"`).

## Key concepts

- **`find()` vs `findOne()`**: `find()` returns a *cursor* over all matching documents (call `.toArray()` to get an array; an empty array if nothing matches). `findOne()` directly returns *the first matching document*, or `null`.
  Docs: [find](https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/) · [findOne](https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/)
- **`ObjectId`**: MongoDB's `_id` is not a plain string. The id received in the URL must be converted with `new ObjectId(...)`. A malformed id throws an exception, hence the `400` status.
- **`$set`**: updates only the provided fields and leaves the others untouched.
- **HTTP status codes**: `201` created, `400` bad request, `404` not found, `500` server error. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

## Going further

Suggested exercises (known limitations of this version):

1. **Validate input** with [zod](https://zod.dev/) or [joi](https://joi.dev/) and accept only a whitelist of fields (`name`, `phone`, `email`). Currently `req.body` is inserted as-is. See [NoSQL injection (OWASP)](https://owasp.org/www-community/attacks/NoSQL_injection).
2. **Fix the REST design**: replace `/new_contact`, `/modify_contact/:id`, `/delete_contact/:id` with `POST /contacts`, `PUT`/`PATCH /contacts/:id`, `DELETE /contacts/:id`. See the [Microsoft guide](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design).
3. **Externalize configuration** (`mongoUrl`, `PORT`) into environment variables (`process.env`, `.env` file).
4. **Restrict CORS** to specific origins.
5. **Add search** by name (`find` with a filter) and **pagination** (`skip`, `limit`).
6. **Split the code** into routes, controllers and data access.

## License

To be completed (for example [MIT](https://choosealicense.com/licenses/mit/)).
