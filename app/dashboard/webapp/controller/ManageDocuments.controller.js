sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/ui/core/BusyIndicator'
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, BusyIndicator) {
    'use strict';

    return Controller.extend('dashboard.controller.ManageDocuments', {
        searchTableMDF: function (oEvent) {
            const query = oEvent.getParameter('newValue');
            const tableManageDocsFiles = this.byId('tableManageDocsFiles');
            const items = tableManageDocsFiles.getBinding('items');

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
        deleteFiles: function () {
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const tableManageDocsFiles = this.byId('tableManageDocsFiles');
            const items = tableManageDocsFiles.getBinding('items');
            const selectedCtx = tableManageDocsFiles.getSelectedContexts();
            const selectedObjects = selectedCtx.map(ctx => ctx.getObject());
            
            if(selectedCtx.length <= 0) {
                MessageToast.show('Please select items to delete.');
            }
            else {
                MessageBox.confirm(`Are you sure you want to delete the selected item${selectedCtx.length > 1 ? 's' : ''}`, {
                    title: 'Confirm Delete',
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: (oAction) => {
                        if(oAction === MessageBox.Action.YES) {
                            BusyIndicator.show();
                            const deletedObjects = selectedObjects.map(obj => {
                                const ctxBinding = remotedata.bindContext(`/Sheets(${obj.ID})`);
                                return ctxBinding.requestObject().then(() => {
                                    const boundContext = ctxBinding.getBoundContext();
                                    return boundContext.delete();
                                });
                            });
                            Promise.all(deletedObjects).then(() => {
                                BusyIndicator.hide();
                                MessageToast.show(`${selectedObjects.length} item${selectedCtx.length > 1 ? 's' : ''} successfully deleted.`);
                                items.refresh();
                            }).catch((err) => {
                                    console.log(err);
                                    BusyIndicator.hide();
                                    MessageToast.show(`Error deleting item${selectedCtx.length > 1 ? 's' : ''}`);
                                });
                        }
                    }
                });
            }
        },
        openDialogUploadFile: function () {
            this.getOwnerComponent().openDialogUploadFile();
        }
    });
});