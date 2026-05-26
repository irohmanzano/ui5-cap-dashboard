sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/m/MessageToast',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/viz/ui5/controls/common/feeds/FeedItem',
    'sap/viz/ui5/data/FlattenedDataset',
    'sap/ui/core/BusyIndicator',
    'sap/ui/core/UIComponent'
], function (Controller, MessageToast, Filter, FilterOperator, FeedItem, FlattenedDataset, BusyIndicator, UIComponent) {
    'use strict';

    return Controller.extend('dashboard.controller.Overview', {
        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.attachRouteMatched(this.attachRouteMatched, this);
        },
        attachRouteMatched: function (oEvent) {
            const routeName = oEvent.getParameter('name');
            const pageDashboard = this.byId('pageDashboard');
            const resourceBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
            const containerSSPDashboardAggregations = this.byId('containerSSPDashboardAggregations');
            const containerOLTPDashboardAggregations = this.byId('containerOLTPDashboardAggregations');

            this.currentRouteName = routeName;
            if(routeName === 'SSPDashboard') {
                containerSSPDashboardAggregations.setVisible(true);
                containerOLTPDashboardAggregations.setVisible(false);
                const title = resourceBundle.getText('pageDashboardTitle', ['SSP']);
                pageDashboard.setTitle(title);
            }
            else if(routeName === 'OLTPDashboard') {
                containerSSPDashboardAggregations.setVisible(false);
                containerOLTPDashboardAggregations.setVisible(true);
                const title = resourceBundle.getText('pageDashboardTitle', ['OLTP']);
                pageDashboard.setTitle(title);
            }
        },
        currentRouteName: '',
        currentSheetID: '',
        loadDashboardData: function (ID) {
            BusyIndicator.show();
            const remotedata = this.getOwnerComponent().getModel('remotedata');

            //RITMs by Creator vizFrame config
            const vizFrameTotalPerCreator = this.byId('vizFrameTotalPerCreator');

            vizFrameTotalPerCreator.setVizProperties({
                title: {
                    text: 'RITMs by Creator'
                },
                interaction: {
                    selectability: {
                        mode: 'single'
                    }
                }
            });
            vizFrameTotalPerCreator.setModel(remotedata);
            const datasetTotalPerCreator = new FlattenedDataset({
                dimensions: [
                    {
                        name: 'Creator',
                        value: '{remotedata>creator}'
                    }
                ],
                measures: [
                    {
                        name: 'TotalRITMs',
                        value: '{remotedata>totalRITMs}'
                    }
                ],
                data: {
                    path: `remotedata>/Sheets(${ID})/aggregations/creators`
                }
            });
            vizFrameTotalPerCreator.destroyDataset();
            vizFrameTotalPerCreator.setDataset(datasetTotalPerCreator);

            const feedItemTotalPerCreatorName = new FeedItem({
                uid: 'categoryAxis',
                type: 'Dimension',
                values: ['Creator']
            });

            const feedItemTotalPerCreatorTotalRITMs = new FeedItem({
                uid: 'valueAxis',
                type: 'Measure',
                values: ['TotalRITMs']
            });

            vizFrameTotalPerCreator.removeAllFeeds();
            vizFrameTotalPerCreator.addFeed(feedItemTotalPerCreatorName);
            vizFrameTotalPerCreator.addFeed(feedItemTotalPerCreatorTotalRITMs);

            //show a data on vizFrameDailyRITMsByCreator
            const oCtxBinding = remotedata.bindContext(`/Sheets(${ID})/aggregations/creators?$top=1`);
            oCtxBinding.requestObject().then(() => {
                const oBoundContext = oCtxBinding.getBoundContext();
                const { ID, creator } = oBoundContext.getObject().value[0];
                this.loadDailyRITMsByCreator(ID, creator);
            }).catch((err) => {
                console.log(err);
                MessageToast.show('Error fetching data.');
            });

            //vizFrameTotalPerDate vizframe config
            const vizFrameTotalPerDate = this.byId('vizFrameTotalPerDate');

            vizFrameTotalPerDate.setVizProperties({
                title: {
                    text: 'Total RITMs per Day'
                }
            });

            vizFrameTotalPerDate.setModel(remotedata, 'remotedata');
            
            const datasetTotalPerDate = new FlattenedDataset({
                dimensions: [
                    {
                        name: 'DateCreated',
                        value: '{remotedata>date}',
                        dataType: 'date'
                    }
                ],
                measures: [
                    {
                        name: 'TotalRITMs',
                        value: '{remotedata>totalRITMs}'
                    }
                ],
                data: {
                    path: `remotedata>/Sheets(${ID})/aggregations/creationDates`
                }
            });
            vizFrameTotalPerDate.destroyDataset();
            vizFrameTotalPerDate.setDataset(datasetTotalPerDate);

            const feedItemTotalPerDateDateCreated = new FeedItem({
                uid: 'timeAxis',
                type: 'Dimension',
                values: ['DateCreated']
            });

            const feedItemTotalPerDateTotalRITMs = new FeedItem({
                uid: 'valueAxis',
                type: 'Measure',
                values: ['TotalRITMs']
            });
            vizFrameTotalPerDate.removeAllFeeds();
            vizFrameTotalPerDate.addFeed(feedItemTotalPerDateDateCreated);
            vizFrameTotalPerDate.addFeed(feedItemTotalPerDateTotalRITMs);
            this.getDashboardTilesData(ID);
            BusyIndicator.hide();
        },
        selectCreatorData: function (oEvent) {
            const creatorName = oEvent.getParameter('data')[0].data.Creator;
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const oListBinding = remotedata.bindList(`/Sheets(${this.currentSheetID})/aggregations/creators`);
            const filter = new Filter({
                filters: [
                    new Filter({
                        path: 'creator',
                        operator: FilterOperator.EQ,
                        value1: creatorName,
                        caseSensitive: false
                    })
                ],
                and: false
            });
            oListBinding.filter(filter);
            oListBinding.requestContexts().then((oCtx) => {
                const { ID, creator } = oCtx.map(ctx => ctx.getObject())[0];
                this.loadDailyRITMsByCreator(ID, creator);
            }).catch((err) => {
                console.log(err);
                MessageToast.show('Error getting data.');
            });
        },
        loadDailyRITMsByCreator: function (creatorID, creatorName) {
            //vizFrameDailyRITMsByCreator vizframe config
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const txtDislayCreatorRITMsTip = this.byId('txtDislayCreatorRITMsTip');
            const vizFrameDailyRITMsByCreator = this.byId('vizFrameDailyRITMsByCreator');

            vizFrameDailyRITMsByCreator.setVizProperties({
                title: {
                    text: `Daily RITMs by ${creatorName}`
                },
                interaction: {
                    selectability: {
                        mode: 'single'
                    }
                }
            });

            vizFrameDailyRITMsByCreator.setModel(remotedata);

            const datasetDailyRITMsByCreator = new FlattenedDataset({
                dimensions: [
                    {
                        name: 'Date',
                        value: '{remotedata>date}'
                    }
                ],
                measures: [
                    {
                        name: 'TotalRITMs',
                        value: '{remotedata>totalRITMs}'
                    }
                ],
                data: {
                    path: `remotedata>/Creators(${creatorID})/creationsPerDate`
                }
            });
            vizFrameDailyRITMsByCreator.destroyDataset();
            vizFrameDailyRITMsByCreator.setDataset(datasetDailyRITMsByCreator);

            const feedItemDailyRITMsByCreatorCreatorDate = new FeedItem({
                uid: 'categoryAxis',
                type: 'Dimension',
                values: ['Date']
            });

            const feedItemDailyRITMsByCreatorTotalRITMs = new FeedItem({
                uid: 'valueAxis',
                type: 'Measure',
                values: ['TotalRITMs']
            });

            vizFrameDailyRITMsByCreator.removeAllFeeds();
            vizFrameDailyRITMsByCreator.addFeed(feedItemDailyRITMsByCreatorCreatorDate);
            vizFrameDailyRITMsByCreator.addFeed(feedItemDailyRITMsByCreatorTotalRITMs);

            txtDislayCreatorRITMsTip.setVisible(true);
        },
        openDialogSelectDataset: function () {
            this.getOwnerComponent().openDialogSelectDataset(this);
        },
        getDashboardTilesData: function (ID) {
            const remotedata = this.getOwnerComponent().getModel('remotedata');
            const ctxBinding = remotedata.bindContext(`/getDashboardTilesData(...)`);
            ctxBinding.setParameter('ID', ID);
            ctxBinding.execute().then(() => {
                const res = ctxBinding.getBoundContext().getObject().value;
                if(this.currentRouteName === 'SSPDashboard') {
                    const SSPDashboardTilesModel = this.getOwnerComponent().getModel('SSPDashboardTilesModel');
                    SSPDashboardTilesModel.setData(JSON.parse(res));
                }
                else if(this.currentRouteName === 'OLTPDashboard') {
                    const OLTPDashboardTilesModel = this.getOwnerComponent().getModel('OLTPDashboardTilesModel');
                    OLTPDashboardTilesModel.setData(JSON.parse(res));
                }
            }).catch((err) => {
                console.log(err);
                MessageToast.show('Error fetching data.');
            });
        }
    });
});