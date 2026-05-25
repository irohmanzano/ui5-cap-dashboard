/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "dashboard/model/models",
        'sap/ui/model/json/JSONModel',
        './controller/SelectDataset',
        './controller/UploadFile'
    ],
    function (UIComponent, Device, models, JSONModel, SelectDataset, UploadFile) {
        "use strict";

        return UIComponent.extend("dashboard.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);
                
                const ToolBarModel = new JSONModel({
                    selectedKey: 'SSPDashboard',
                    navigation: [
                        {   
                            icon: 'sap-icon://bbyd-dashboard',
                            key: 'SSPDashboard',
                            text: 'SSP Dashboard'
                        },
                        {   
                            icon: 'sap-icon://Chart-Tree-Map',
                            key: 'OLTPDashboard',
                            text: 'OLTP Dashboard'
                        },
                        {
                            icon: 'sap-icon://add-document',
                            key: 'managedocuments',
                            text: 'Manage Documents'
                        }
                    ]
                });

                const DashboardTilesModel = new JSONModel({
                    fileSource: 'Click to select dataset',
                    totalRITMs: 0,
                    uniqueCreators: 0,
                    topCreators: '',
                    dateRange: '',
                    busiestDays: '',
                    avgRITMsPerDay: 0
                });

                const FileCategoryModel = new JSONModel({
                    selectedKey: 'SSP',
                    items: [
                        {
                            key: 'SSP',
                            text: 'SSP'
                        },
                        {
                            key: 'OLTP',
                            text: 'OLTP'
                        }
                    ]
                });

                const FileUploadModel = new JSONModel({
                    category: '',
                    type: '',
                    file: ''
                });

                // enable routing
                this.getRouter().initialize();

                this._SelectDataset = new SelectDataset(this.getRootControl());
                this._UploadFile = new UploadFile(this.getRootControl());

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(ToolBarModel, 'ToolBarModel');
                this.setModel(DashboardTilesModel, 'DashboardTilesModel');
                this.setModel(FileCategoryModel, 'FileCategoryModel');
                this.setModel(FileUploadModel, 'FileUploadModel');
            },
            exit: function () {
                this._SelectDataset.destroy();
                delete this._SelectDataset;

                this._UploadFile.destrou();
                delete this._UploadFile;
            },
            openDialogSelectDataset: function(oController) {
                this._SelectDataset.open(oController);
            },
            openDialogUploadFile: function () {
                this._UploadFile.open();
            }
        });
    }
);