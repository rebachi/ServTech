sap.ui.define([
	"com/publix/servtech/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator"
	
], function(BaseController, JSONModel, MessageToast, Filter, FilterType,FilterOperator ) {
	"use strict";

	return BaseController.extend("com.publix.servtech.controller.RepairHistory", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.publix.servtech.view.RepairHistory
		 */
		onInit: function() {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.setModel(oViewModel, "repairHistoryView");

			this.getRouter().getRoute("repairHistory").attachPatternMatched(this._onObjectMatched, this);
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.publix.servtech.view.RepairHistory
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.publix.servtech.view.RepairHistory
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.publix.servtech.view.RepairHistory
		 */
		//	onExit: function() {
		//
		//	}

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			//var sObjectId = oEvent.getParameter("arguments").objectId;
			// this.getModel().metadataLoaded().then(function() {
			// 	var sObjectPath = this.getModel().createKey("SO_header1Set", {
			// 		Number: sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
			var oViewModel = this.getModel("repairHistoryView");
			var equipID = oEvent.getParameter("arguments").equipID;
			oViewModel.setProperty("/equipID", equipID);

			var oTable, oBinding, aFilters;

			oTable = this.getView().byId("EquipementHistory"); //get the reference to your Select control
			oBinding = oTable.getBinding("items");
			aFilters = [];

			if (equipID) {
				aFilters.push(new Filter("Equipment", FilterOperator.EQ, equipID));
			}
			oBinding.filter(aFilters, FilterType.Application);
		}

	});

});