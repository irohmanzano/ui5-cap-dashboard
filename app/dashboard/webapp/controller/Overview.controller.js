sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/m/MessageToast',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (Controller, MessageToast, Filter, FilterOperator) {
    'use strict';

    return Controller.extend('dashboard.controller.Overview', {
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
                    const listFiles = this.byId('listFiles');
                    const items = listFiles.getBinding('items');
                    items.refresh();
                }).catch((err) => {
                    console.log(err);
                    MessageToast.show('File upload failed.');
                });;
            };

            reader.readAsArrayBuffer(file);
        },
        loadFile: function (oEvent) {
            const object = oEvent.getSource().getBindingContext('remotedata').getObject();
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const oCtxBinding = remotedata.bindContext('/getDashboardData(...)');
            oCtxBinding.setParameter('ID', object.ID);
            oCtxBinding.execute().then(() => {
                const res = oCtxBinding.getBoundContext().getObject().value;
                const obj = JSON.parse(res);
                console.log(obj);
            }).catch((err) => {
                console.log(err);
                MessageToast.show('Failed to get file data.');
            });
        }
    });
});