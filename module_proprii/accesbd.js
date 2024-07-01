/**
 * ATENȚIE!
 * încă nu am implementat protecția contra SQL injection
 */

const { Client, Pool } = require("pg");

class AccesBD {
    static #instanta = null; // al clasei
    static #initializat = false;

    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instanțiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fără să fi aruncat vreo eroare");
        }
    }

    /**
     * Inițializează conexiunea locală la baza de date.
     */
    initLocal() {
        this.client = new Client({
            database: "ScoutShop",
            user: "cosmin",
            password: "cosmin",
            host: "localhost",
            port: 5432
        });
        this.client.connect();
    }

    /**
     * Returnează clientul de bază de date.
     * @returns {Client} - Obiectul client pentru baza de date.
     * @throws {Error} - Dacă clasa nu a fost instanțiată.
     */
    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instanțiată clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - Obiect primit de funcțiile care realizează un query.
     * @property {string} init - Tipul de conexiune ("local", "render" etc.)
     */

    /**
     * Returnează instanța unică a clasei.
     * 
     * @param {ObiectConexiune} [init={}] - Un obiect cu datele pentru query.
     * @returns {AccesBD} - Instanța clasei AccesBD.
     */
    static getInstanta({ init = "local" } = {}) {
        console.log(this); // this-ul este clasa, nu instanța, pentru că metoda este statică
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            // Inițializarea poate arunca erori
            // Vom adăuga aici cazurile de inițializare 
            // pentru baza de date cu care vrem să lucrăm
            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal();
                }
                // Dacă ajunge aici înseamnă că nu s-a produs eroare la inițializare
            } catch (e) {
                console.error("Eroare la inițializarea bazei de date!");
            }
        }
        return this.#instanta;
    }

    /**
     * @typedef {object} ObiectQuerySelect - Obiect primit de funcțiile care realizează un query.
     * @property {string} tabel - Numele tabelului.
     * @property {string[]} campuri - O listă de stringuri cu numele coloanelor afectate de query; poate cuprinde și elementul "*".
     * @property {string[]} conditiiAnd - Lista de stringuri cu condiții pentru where.
     */

    /**
     * Callback pentru query-uri.
     * @callback QueryCallBack
     * @param {Error} err - Eventuala eroare în urma query-ului.
     * @param {Object} rez - Rezultatul query-ului.
     */

    /**
   * Selecteaza inregistrari din baza de date
   *
   * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
   * @param {QueryCallBack} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
   */
  select(
    { tabel = "", campuri = [], conditiiAnd = [] } = {},
    callback,
    parametriQuery = []
  ) {
    let conditieWhere = "";
    if (conditiiAnd.length > 0){
      conditieWhere = "where ";
      conditiiAnd.forEach((grup, index) => {
        if (index > 0) conditieWhere += " or ";
        conditieWhere += "(" + grup.join(" and ") + ")";
      });
    }
    let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
    console.error(comanda);
    /*
        comanda=`select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2;
        this.client.query(comanda,[val1, val2],callback)

        */
    this.client.query(comanda, parametriQuery, callback);
  }

    /**
     * Selectează înregistrări din baza de date asincron.
     * 
     * @param {ObiectQuerySelect} [obj={}] - Un obiect cu datele pentru query.
     * @returns {Promise<Object>} - Rezultatul query-ului.
     */
    async selectAsync({ tabel = "", campuri = [], conditiiAnd = [] } = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);
        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Inserează înregistrări în baza de date.
     * 
     * @param {object} [obj={}] - Un obiect cu datele pentru query.
     * @param {string} [obj.tabel=""] - Numele tabelului.
     * @param {object} [obj.campuri={}] - Obiect cu perechi cheie-valoare reprezentând coloanele și valorile de inserat.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    insert({ tabel = "", campuri = {} } = {}, callback) {
        console.log("-------------------------------------------")
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values (${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * Actualizează înregistrări în baza de date.
     * 
     * @param {object} [obj={}] - Un obiect cu datele pentru query.
     * @param {string} [obj.tabel=""] - Numele tabelului.
     * @param {object} [obj.campuri={}] - Obiect cu perechi cheie-valoare reprezentând coloanele și valorile de actualizat.
     * @param {string[]} [obj.conditiiAnd=[]] - Lista de stringuri cu condiții pentru where.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    update(
        { tabel = "", campuri = {}, conditiiAnd = [] } = {},
        callback,
        parametriQuery
      ) {
        let campuriActualizate = [];
        for (let prop in campuri)
          campuriActualizate.push(`${prop}='${campuri[prop]}'`);
    
        let conditieWhere = "";
        if (conditiiAnd.length > 0) {
          conditieWhere = "where ";
          conditiiAnd.forEach((grup, index) => {
            if (index > 0) conditieWhere += " or ";
            conditieWhere += "(" + grup.join(" and ") + ")";
          });
        }
    
        let comanda = `update ${tabel} set ${campuriActualizate.join(
          ", "
        )} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback);
      }

    /**
     * Actualizează înregistrări în baza de date utilizând query parametrizat.
     * 
     * @param {object} [obj={}] - Un obiect cu datele pentru query.
     * @param {string} [obj.tabel=""] - Numele tabelului.
     * @param {string[]} [obj.campuri=[]] - O listă de stringuri cu numele coloanelor de actualizat.
     * @param {any[]} [obj.valori=[]] - O listă de valori corespunzătoare coloanelor de actualizat.
     * @param {string[]} [obj.conditiiAnd=[]] - Lista de stringuri cu condiții pentru where.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    updateParametrizat({ tabel = "", campuri = [], valori = [], conditiiAnd = [] } = {}, callback) {
        if (campuri.length != valori.length)
            throw new Error("Numărul de câmpuri diferă de numărul de valori");
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i + 1}`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")} ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);
        this.client.query(comanda, valori, callback)
    }

    /**
     * Șterge înregistrări din baza de date.
     * 
     * @param {object} [obj={}] - Un obiect cu datele pentru query.
     * @param {string} [obj.tabel=""] - Numele tabelului.
     * @param {string[]} [obj.conditiiAnd=[]] - Lista de stringuri cu condiții pentru where.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    delete({ tabel = "", conditiiAnd = [] } = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * Rulează un query personalizat.
     * 
     * @param {string} comanda - Comanda SQL de executat.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }
}

module.exports = AccesBD; // exportăm clasa AccesBD
