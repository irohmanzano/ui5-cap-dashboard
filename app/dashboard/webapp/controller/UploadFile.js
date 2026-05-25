sap.ui.define([
    'sap/ui/base/ManagedObject',
    'sap/ui/core/Fragment',
    'sap/ui/core/BusyIndicator',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageToast'
], function (ManagedObject, Fragment, BusyIndicator, Filter, FilterOperator, MessageToast) {
    "use strict";

    return ManagedObject.extend('dashboard.controller.UploadFile', {
        constructor: function (oView) {
            this._oView = oView;
        },
        exit: function () {
            delete this._oView;
        },
        open: function () {
            const oView = this._oView;

            const controller = {
                closeDialogUploadFile: function () {
                    this.dialogUploadFileEscapeHandler();
                    oView.byId('dialogUploadFile').close();
                },
                dialogUploadFileEscapeHandler: function (oPromise) {
                    const fileUploaderExcel = oView.byId('fileUploaderExcel');
                    const inputSelectedFileName = oView.byId('inputSelectedFileName');
                    fileUploaderExcel.clear();
                    inputSelectedFileName.setValue('');
                    if(oPromise) {
                        oPromise.resolve();
                    }
                },
                checkDuplicateFile: function (fileName) {
                    const remotedata = oView.getModel('remotedata');
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
                processFile: async function (oEvent) {
                    BusyIndicator.show();
                    const inputSelectedFileName = oView.byId('inputSelectedFileName');
                    const fileUploaderExcel = oView.byId('fileUploaderExcel');
                    const file = oEvent.getParameter('files')[0];
                    const reader = new FileReader();
                    if(!file) {
                        fileUploaderExcel.clear();
                        BusyIndicator.hide();
                        return;
                    }

                    const res = await this.checkDuplicateFile(file.name);

                    if(!res) {
                        fileUploaderExcel.clear();
                        BusyIndicator.hide();
                        return;
                    }

                    if(res.success && res.hasDuplicate) {
                        fileUploaderExcel.clear();
                        BusyIndicator.hide();
                        MessageToast.show('File already exists.');
                        return;
                    }

                    inputSelectedFileName.setValue(file.name);

                    reader.onload = (e) => {
                        const comBoxFileCategory = oView.byId('comBoxFileCategory');
                        const selectedCategory = comBoxFileCategory.getSelectedKey();
                        const arrayBuffer = e.target.result;
                        const arr = new Uint8Array(arrayBuffer);
                        let binary = '';
                        arr.forEach((c) => binary += String.fromCharCode(c));
                        const base64String = btoa(binary);
                        
                        const FileUploadModel = oView.getModel('FileUploadModel');
                        FileUploadModel.setData({
                            category: selectedCategory,
                            name: file.name,
                            type: file.type,
                            file: base64String
                        });
                        BusyIndicator.hide();
                    };

                    reader.readAsArrayBuffer(file);
                },
                uploadFile: function () {
                    const fileUploaderExcel = oView.byId('fileUploaderExcel');
                    if(!fileUploaderExcel.getValue()) {
                        MessageToast.show('No file selected.');
                        return;
                    }
                    BusyIndicator.show();
                    const FileUploadModel = oView.getModel('FileUploadModel');
                    const FileUploadModelData = FileUploadModel.getData();
                    const remotedata = oView.getModel('remotedata');
                    const oListBinding = remotedata.bindList('/Sheets');

                    const oCtx = oListBinding.create(FileUploadModelData);

                    oCtx.created().then(() => {
                        MessageToast.show('File uploaded successfully');
                        const tableManageDocsFiles = sap.ui.getCore().byId('container-dashboard---managedocuments--tableManageDocsFiles');
                        const items = tableManageDocsFiles.getBinding('items');
                        items.refresh();
                        fileUploaderExcel.clear();
                        this.closeDialogUploadFile();
                        BusyIndicator.hide();
                    }).catch((err) => {
                        console.log(err);
                        fileUploaderExcel.clear();
                        BusyIndicator.hide();
                        MessageToast.show('File upload failed.');
                    });;
                }
            }

            if(!oView.byId('dialogUploadFile')) {
                Fragment.load({
                    id: oView.getId(),
                    name: 'dashboard.view.UploadFile',
                    controller
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    const oComp = oView.getController().getOwnerComponent();
                    oDialog.setModel(oComp.getModel('remotedata'), 'remotedata');
                    oDialog.setModel(oComp.getModel('FileUploadModel'), 'FileUploadModel');
                    oDialog.open();
                });
            }
            else {
                oView.byId('dialogUploadFile').open();
            }
        }
    });
});