sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageToast'
], function (Controller, Filter, FilterOperator, MessageToast) {
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
                const dateUploaded = new Date().toISOString().split('T')[0];

                const oCtx = oListBinding.create({
                    name: file.name,
                    dateUploaded,
                    type,
                    file: base64String
                });

                oCtx.created().then(() => {
                    MessageToast.show('File uploaded successfully');
                    const { ID } = oCtx.getObject();
                    const listFiles = this.byId('listManagedDocsFiles');
                    const items = listFiles.getBinding('items');
                    items.refresh();
                }).catch((err) => {
                    console.log(err);
                    MessageToast.show('File upload failed.');
                });;
            };

            reader.readAsArrayBuffer(file);
        },
    });
});