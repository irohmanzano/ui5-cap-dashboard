/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "dashboard/model/models",
        'sap/ui/model/json/JSONModel'
    ],
    function (UIComponent, Device, models, JSONModel) {
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
                    selectedKey: 'dashboard',
                    navigation: [
                        {   
                            icon: 'sap-icon://bbyd-dashboard',
                            key: 'dashboard',
                            text: 'Dashboard'
                        },
                        {
                            icon: 'sap-icon://add-document',
                            key: 'managedocuments',
                            text: 'Manage Documents'
                        }
                    ]
                });

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(ToolBarModel, 'ToolBarModel');
            }
        });
    }
);