using { cuid } from '@sap/cds/common';

namespace sap.db;

entity Sheets: cuid {
    name:   String;
    type    : String;
    file    : LargeBinary @Core.MediaType: type;
}