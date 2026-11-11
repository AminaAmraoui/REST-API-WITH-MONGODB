/*
 * ============================================================================
 *  API REST de gestion de contacts (CRUD) avec Express + MongoDB
 * ============================================================================
 *
 *  CRUD = Create, Read, Update, Delete. Ce serveur expose 5 routes :
 *
 *    Méthode  Route                    Action
 *    -------  -----------------------  ------------------------------------
 *    POST     /new_contact             Créer un contact
 *    GET      /contacts                Lire tous les contacts
 *    GET      /contacts/:id            Lire un contact par son identifiant
 *    PUT      /modify_contact/:id      Modifier un contact
 *    DELETE   /delete_contact/:id      Supprimer un contact
 *
 *  Prérequis :
 *    - Node.js installé
 *    - MongoDB lancé en local sur le port 27017
 *    - "type": "module" dans package.json (obligatoire pour utiliser
 *      import/export ET le "await" au niveau racine, voir plus bas)
 *    - Dépendances installées : npm install express mongodb cors
 */

// ---------------------------------------------------------------------------
// 1. IMPORTS (syntaxe ES Modules)
// ---------------------------------------------------------------------------

// Express : framework web minimaliste pour Node.js. Il permet de définir
// des routes (URL + méthode HTTP) et de répondre aux requêtes des clients.
import express from "express";

// MongoClient : permet de se connecter au serveur MongoDB.
// ObjectId    : classe qui représente l'identifiant unique (_id) que MongoDB
//               génère automatiquement pour chaque document. Ce n'est PAS une
//               simple chaîne de caractères : il faut convertir la chaîne
//               reçue dans l'URL en ObjectId avant de chercher en base.
import { MongoClient, ObjectId } from "mongodb";

// CORS (Cross-Origin Resource Sharing) : par défaut, un navigateur interdit
// à une page web d'appeler une API hébergée sur une autre origine
// (autre domaine, autre port...). Ce middleware ajoute les en-têtes HTTP
// nécessaires pour l'autoriser. Utile quand un front (React, React Native
// Web...) tourne sur un port différent de l'API.
import cors from "cors";

// ---------------------------------------------------------------------------
// 2. CRÉATION DE L'APPLICATION ET DES MIDDLEWARES
// ---------------------------------------------------------------------------

// On crée l'application Express : c'est notre serveur.
const app = express();

// Middleware = fonction exécutée AVANT nos routes, pour chaque requête.
//
// express.json() lit le corps (body) des requêtes au format JSON et le
// transforme en objet JavaScript accessible via "req.body".
// Sans lui, req.body vaudrait undefined.
app.use(express.json());

// cors() sans option : autorise TOUTES les origines.
// Pratique pour un TP, mais en production on restreint à des origines précises
// (ex. : cors({ origin: "https://mon-site.com" })).
app.use(cors());

// ---------------------------------------------------------------------------
// 3. CONFIGURATION DE LA BASE DE DONNÉES
// ---------------------------------------------------------------------------

// URL de connexion à MongoDB (ici : serveur local, port par défaut 27017).
const mongoUrl = "mongodb://localhost:27017";

// Nom de la base de données. Si elle n'existe pas, MongoDB la crée
// automatiquement lors de la première écriture.
const databaseName = "DBContact";

// Variable qui contiendra l'objet base de données une fois connecté.
// Elle est déclarée ici (portée globale au fichier) pour être utilisable
// dans toutes les routes plus bas.
let db;

// ---------------------------------------------------------------------------
// 4. CONNEXION À LA BASE DE DONNÉES
// ---------------------------------------------------------------------------

// Fonction asynchrone : se connecter à MongoDB est une opération qui prend
// du temps (réseau), donc on utilise async/await pour attendre le résultat
// sans bloquer le programme.
async function connectToDB() {
  try {
    // Création du client MongoDB avec l'URL de connexion.
    const client = new MongoClient(mongoUrl);

    // Ouverture effective de la connexion (opération asynchrone).
    await client.connect();

    // On récupère la base de données et on la stocke dans la variable globale.
    db = client.db(databaseName);
    console.log("Connected to MongoDB");
  } catch (error) {
    // Si la connexion échoue (MongoDB éteint, mauvaise URL...), inutile de
    // démarrer le serveur : on affiche l'erreur et on arrête le programme.
    // Le code 1 signifie "arrêt avec erreur" (0 = arrêt normal).
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

// "await" au niveau racine du fichier (top-level await) : on ne passe pas à la
// suite du code tant que la connexion à la base de données n'est pas établie.
// Cela n'est possible que dans un module ES ("type": "module" dans package.json).
await connectToDB();

// ---------------------------------------------------------------------------
// 5. ROUTES (ENDPOINTS)
// ---------------------------------------------------------------------------
// Chaque route a la forme : app.METHODE("chemin", fonction(req, res) { ... })
//   - req (request)  : la requête du client (corps, paramètres d'URL, en-têtes)
//   - res (response) : l'objet qui sert à répondre au client
//
// Codes HTTP utilisés ici :
//   200 OK            : succès (valeur par défaut de res.json)
//   201 Created       : ressource créée avec succès
//   400 Bad Request   : requête invalide (ex. : identifiant mal formé)
//   404 Not Found     : ressource introuvable
//   500 Server Error  : erreur interne côté serveur

// ----------------------------- CREATE --------------------------------------
// Ajouter un contact
app.post("/new_contact", async (req, res) => {
  try {
    // Le client envoie le contact en JSON dans le corps de la requête.
    // Exemple : { "name": "Sara", "phone": "12345678" }
    // ATTENTION : ici on insère tel quel tout ce que le client envoie, sans
    // aucune validation (voir la note de sécurité à la fin du fichier).
    const newContact = req.body;

    // db.collection("contacts") : accède à la collection "contacts"
    // (équivalent d'une table en SQL ; elle est créée automatiquement si
    // elle n'existe pas).
    // insertOne() insère UN seul document et renvoie un objet résultat qui
    // contient notamment insertedId, l'_id généré par MongoDB.
    const result = await db.collection("contacts").insertOne(newContact);

    // 201 = "Created". On renvoie l'identifiant du nouveau contact.
    res.status(201).json({ message: "Contact added", id: result.insertedId });
  } catch (error) {
    // On affiche l'erreur dans la console du serveur (pour le développeur)...
    console.error(error);
    // ...mais on renvoie un message générique au client, pour ne pas lui
    // révéler de détails internes.
    res.status(500).json({ message: "Cannot add new contact" });
  }
});

// ------------------------------ READ (tous) --------------------------------
// Récupérer tous les contacts
app.get("/contacts", async (req, res) => {
  try {
    // find() sans argument = aucun filtre = TOUS les documents.
    //
    // find() ne renvoie PAS directement les documents : il renvoie un CURSEUR,
    // c'est-à-dire un objet qui permet de parcourir les résultats petit à petit.
    // toArray() consomme ce curseur et charge tous les résultats dans un
    // tableau JavaScript.
    //
    // (Sur une très grosse collection, charger tout en mémoire est une mauvaise
    // idée : on utiliserait alors la pagination avec .skip() et .limit().)
    const contacts = await db.collection("contacts").find().toArray();

    // res.json() convertit le tableau en JSON et l'envoie (statut 200 par défaut).
    res.json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot fetch contacts" });
  }
});

// ------------------------------ READ (un seul) -----------------------------
// Récupérer un contact par ID
// ":id" est un paramètre de route : pour GET /contacts/65f1a2..., la valeur
// "65f1a2..." est disponible dans req.params.id.
app.get("/contacts/:id", async (req, res) => {
  try {
    // L'id reçu dans l'URL est une chaîne de caractères. Dans MongoDB, le champ
    // _id est de type ObjectId : on doit donc convertir. Si la chaîne n'a pas
    // le bon format (24 caractères hexadécimaux), "new ObjectId()" lève une
    // exception, interceptée par le catch ci-dessous (-> erreur 400).
    const id = new ObjectId(req.params.id);

    // findOne(filtre) renvoie directement LE PREMIER document qui correspond
    // au filtre, ou null s'il n'y en a aucun.
    const contact = await db.collection("contacts").findOne({ _id: id });

    // Aucun document trouvé : l'id est valide mais n'existe pas en base.
    // "return" arrête la fonction ici pour ne pas exécuter res.json plus bas
    // (sinon on tenterait d'envoyer deux réponses).
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(contact);
  } catch (error) {
    console.error(error);
    // Ici le plus souvent : id mal formé -> c'est une erreur du client (400).
    res.status(400).json({ message: "Invalid ID format" });
  }
});

/*
 * ----------------------------------------------------------------------------
 *  À RETENIR : find() vs findOne()
 * ----------------------------------------------------------------------------
 *  find(filtre)     -> renvoie un CURSEUR sur TOUS les documents qui
 *                      correspondent. Il faut le convertir (.toArray()) ou le
 *                      parcourir pour obtenir les données. Si rien ne
 *                      correspond : tableau vide [].
 *
 *  findOne(filtre)  -> renvoie directement UN SEUL document (le premier
 *                      trouvé), sous forme d'objet. Si rien ne correspond :
 *                      null.
 *
 *  Règle pratique : plusieurs résultats attendus -> find().toArray()
 *                   un résultat attendu (recherche par _id) -> findOne()
 *
 *  Doc officielle :
 *   - https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/
 *   - https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/
 * ----------------------------------------------------------------------------
 */

// ------------------------------ UPDATE -------------------------------------
// Mettre à jour un contact
app.put("/modify_contact/:id", async (req, res) => {
  try {
    // Conversion de l'id (chaîne -> ObjectId), comme pour la lecture.
    const id = new ObjectId(req.params.id);

    // updateOne(filtre, modification) modifie le premier document trouvé.
    //   - 1er argument : le filtre qui désigne le document à modifier.
    //   - 2e argument  : l'opération de mise à jour. L'opérateur $set ne
    //     modifie QUE les champs fournis et laisse les autres intacts.
    //     (Sans $set, MongoDB refuse un document "brut" dans updateOne.)
    // req.body contient les nouvelles valeurs envoyées par le client en JSON.
    const result = await db.collection("contacts").updateOne(
      { _id: id },
      { $set: req.body } // met à jour les champs du document avec les valeurs envoyées dans le corps de la requête HTTP (req.body).
    );

    // matchedCount = nombre de documents correspondant au filtre.
    // 0 -> aucun contact avec cet id -> 404.
    // (À ne pas confondre avec modifiedCount, qui vaut 0 si les valeurs
    // envoyées sont identiques à celles déjà en base.)
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // updateOne ne renvoie pas le document modifié, seulement des compteurs.
    // Pour renvoyer le contact modifié, on le relit en base avec findOne.
    const updatedContact = await db.collection("contacts").findOne({ _id: id });
    res.json({ message: "Contact updated successfully", contact: updatedContact });

  } catch (error) {
    console.error("Update error:", error);
    // Ici on renvoie aussi error.message au client : pratique pour déboguer en
    // TP, mais à éviter en production (fuite d'informations internes).
    res.status(400).json({ message: "Error updating contact", error: error.message });
  }
});

// ------------------------------ DELETE -------------------------------------
// Supprimer un contact
app.delete("/delete_contact/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);

    // deleteOne(filtre) supprime le premier document correspondant au filtre.
    // deletedCount = nombre de documents réellement supprimés (0 ou 1).
    const result = await db.collection("contacts").deleteOne({ _id: id });

    // 0 supprimé -> aucun contact avec cet id.
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error deleting contact" });
  }
});

// ---------------------------------------------------------------------------
// 6. DÉMARRAGE DU SERVEUR
// ---------------------------------------------------------------------------

// Port d'écoute du serveur. Le serveur sera accessible sur http://localhost:3000
const PORT = 3000;

// listen() démarre le serveur. La fonction fournie est appelée une fois que
// le serveur est prêt à recevoir des requêtes.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/*
 * ----------------------------------------------------------------------------
 *  NOTES POUR ALLER PLUS LOIN (limites volontaires de ce code de TP)
 * ----------------------------------------------------------------------------
 *  1. Aucune validation des données : POST et PUT acceptent n'importe quel
 *     champ présent dans req.body. Il faudrait valider avec une bibliothèque
 *     (zod, joi...) et n'autoriser qu'une liste de champs (name, phone, email).
 *     Voir : https://owasp.org/www-community/attacks/NoSQL_injection
 *
 *  2. Conception REST : le verbe est dans l'URL (/new_contact, /modify_contact).
 *     La convention serait POST /contacts, PUT ou PATCH /contacts/:id et
 *     DELETE /contacts/:id.
 *     Voir : https://learn.microsoft.com/fr-fr/azure/architecture/best-practices/api-design
 *
 *  3. Configuration en dur : mongoUrl et PORT devraient venir de variables
 *     d'environnement (process.env), pas du code source.
 *
 *  4. CORS ouvert à toutes les origines : à restreindre en production.
 * ----------------------------------------------------------------------------
 */
