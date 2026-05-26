sap.ui.define([
    'sap/ui/base/ManagedObject',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (ManagedObject, Fragment, Filter, FilterOperator) {
    'use strict';

    return ManagedObject.extend('dashboard.controller.SelectDataset', {
        constructor: function (oView) {
            this._oView = oView;
        },
        exit: function () {
            delete this._oView;
        },
        open: function (oCallerController) {
            const oController = oCallerController;
            const oView = this._oView;
            const fragId = oView.getId() + `--${Date.now()}---`;
            const controller = {
                closeDialogSelectDataset: function () {
                    const dialogSelectDataset = Fragment.byId(fragId, 'dialogSelectDataset');
                    dialogSelectDataset.close();
                },
                searchTableSelectDataset: function (oEvent) {
                    const query = oEvent.getParameter('newValue');
                    const tableSelectDataset = Fragment.byId(fragId, 'tableSelectDataset');
                    const items = tableSelectDataset.getBinding('items');

                    const filter = new Filter({
                        filters: [
                            new Filter(
                                {
                                    path: 'name',
                                    operator: FilterOperator.Contains,
                                    value1: query,
                                    caseSensitive: false
                                } 
                            ),
                            new Filter(
                                {
                                    path: 'category',
                                    operator: FilterOperator.Contains,
                                    value1: query,
                                    caseSensitive: false
                                } 
                            ),
                            new Filter(
                                {
                                    path: 'dateRange',
                                    operator: FilterOperator.Contains,
                                    value1: query,
                                    caseSensitive: false
                                }
                            ),
                            new Filter(
                                {
                                    path: 'uploadedBy',
                                    operator: FilterOperator.Contains,
                                    value1: query,
                                    caseSensitive: false
                                }
                            )
                        ],
                        and: false
                    });
                    items.filter(filter);
                },
                refreshTableItems: function () {
                    const tableSelectDataset = Fragment.byId(fragId, 'tableSelectDataset');
                    const items = tableSelectDataset.getBinding('items');
                    items.refresh();
                },
                setCurrentSheetModel: function (oEvent) {
                    const ID = oEvent.getSource().getBindingContext('remotedata').getObject().ID;
                    oController.currentSheetID = ID;
                    oController.loadDashboardData(ID);
                    this.closeDialogSelectDataset();
                }
            };

            if(!Fragment.byId(fragId, 'dialogSelectDataset')) {
                Fragment.load({
                    id: fragId,
                    name: 'dashboard.view.SelectDataset',
                    controller
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    oDialog.attachAfterOpen(controller.refreshTableItems);
                    oDialog.attachAfterClose(() => {
                        oView.removeDependent(oDialog);
                        oDialog.destroy();
                    });
                    oDialog.open();
                });
            }
            else {
                Fragment.byId(fragId, 'dialogSelectDataset').open();
            }
        }
    });
});