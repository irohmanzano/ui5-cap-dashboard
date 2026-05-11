using { cuid } from '@sap/cds/common';

namespace sap.db;

entity Sheets: cuid {
    name            : String;
    dateUploaded    : Date;
    timestamp       : String;
    uploadedBy      : String;
    dateRange       : String;
    type            : String;
    file            : LargeBinary @Core.MediaType: type;
    aggregations    : Composition of one DataAggregations on aggregations.sheet = $self;
}

entity DataAggregations: cuid {
    sheet           : Association to Sheets;
    creators        : Composition of many Creators on creators.dataAggregation = $self;
    creationDates   : Composition of many CreationDates on creationDates.dataAggregation = $self;
}

entity Creators: cuid {
    dataAggregation     : Association to DataAggregations;
    creator             : String;
    totalRITMs          : Integer;
    creationsPerDate    : Composition of many CreationsPerDate on creationsPerDate.creator = $self;
}

entity CreationDates: cuid {
    dataAggregation : Association to DataAggregations;
    date            : Date;
    totalRITMs      : Integer;
}

entity CreationsPerDate: cuid {
    creator     : Association to Creators;
    date        : Date;
    totalRITMs  : Integer;
}