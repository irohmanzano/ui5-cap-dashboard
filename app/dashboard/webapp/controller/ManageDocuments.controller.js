sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageToast',
    'sap/m/MessageBox'
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    'use strict';

    return Controller.extend('dashboard.controller.ManageDocuments', {
        checkDuplicateFile: function (fileName) {
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const oListBinding = remotedata.bindList('/Sheets');
            const filter = new Filter({
                filters: [
                    new Filter({
                        path: 'name',
                        operator: FilterOperator.EQ,
                        value1: fileName,
                        caseSensitive: false
                    })
                ],
                and: false
            });
            oListBinding.filter(filter);
            return oListBinding.requestContexts().then((oCtx) => {
                const obj = oCtx.map(ctx => ctx.getObject());
                if(obj.length > 0) {
                    return {
                        success: true,
                        hasDuplicate: true
                    };
                }
                else {
                    return {
                        success: true,
                        hasDuplicate: false
                    };
                }
            }).catch((err) => {
                MessageToast.show('Failed to get database data.');
                console.log(err);
            });
        },
        uploadFile: async function (oEvent) {
            const file = oEvent.getParameter('files')[0];
            const reader = new FileReader();
            const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            if(!file) {
                return;
            }

            const res = await this.checkDuplicateFile(file.name);

            if(!res) {
                return;
            }

            if(res.success && res.hasDuplicate) {
                MessageToast.show('File already exists.');
                return;
            }

            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const arr = new Uint8Array(arrayBuffer);
                let binary = '';
                arr.forEach((c) => binary += String.fromCharCode(c));
                const base64String = btoa(binary);

                const remotedata = this.getOwnerComponent().getModel('remotedata');
                const oListBinding = remotedata.bindList('/Sheets');

                const oCtx = oListBinding.create({
                    name: file.name,
                    type,
                    file: base64String
                });

                oCtx.created().then(() => {
                    MessageToast.show('File uploaded successfully');
                    const tableManageDocsFiles = this.byId('tableManageDocsFiles');
                    const items = tableManageDocsFiles.getBinding('items');
                    items.refresh();
                }).catch((err) => {
                    console.log(err);
                    MessageToast.show('File upload failed.');
                });;
            };

            reader.readAsArrayBuffer(file);
        },
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
                            const deletedObjects = selectedObjects.map(obj => {
                                const ctxBinding = remotedata.bindContext(`/Sheets(${obj.ID})`);
                                return ctxBinding.requestObject().then(() => {
                                    const boundContext = ctxBinding.getBoundContext();
                                    return boundContext.delete();
                                });
                            });
                            Promise.all(deletedObjects).then(() => {
                                MessageToast.show(`${selectedObjects.length} item${selectedCtx.length > 1 ? 's' : ''} successfully deleted.`);
                                items.refresh();
                            }).catch((err) => {
                                    console.log(err);
                                    MessageToast.show(`Error deleting item${selectedCtx.length > 1 ? 's' : ''}`);
                                });
                        }
                    }
                });
            }
        }
    });
});