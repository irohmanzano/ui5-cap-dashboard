using sap.db from '../db/schema';

service CatalogService {
    entity Sheets as projection on db.Sheets;
    function readFile(ID: String) returns String;
}