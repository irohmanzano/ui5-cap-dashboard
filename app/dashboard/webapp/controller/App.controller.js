sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/UIComponent'
],
function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("dashboard.controller.App", {
        expandMenu: function () {
            const toolPage = this.byId('toolPage');
            toolPage.setSideExpanded(!toolPage.getSideExpanded());
        },
        onItemSelect: function (oEvent) {
            const key = oEvent.getParameter('item').getKey();
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo(key);
        }
    });
});
