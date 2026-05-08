sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/UIComponent'
],
function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("dashboard.controller.App", {
        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.attachRouteMatched(this._onRouteMatch, this);
        },
        _onRouteMatch: function (oEvent) {
            const routeName = oEvent.getParameter('name');
            const navigationList = this.byId('navigationList');
            navigationList.setSelectedKey(routeName);
        },
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
