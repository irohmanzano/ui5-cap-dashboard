using sap.db from '../db/schema';

service CatalogService {
    entity Sheets as projection on db.Sheets;
    entity DataAggregations as projection on db.DataAggregations;
    entity Creators as projection on db.Creators;
    entity CreationDates as projection on db.CreationDates;
    entity CreationsPerDate as projection on db.CreationsPerDate;
}