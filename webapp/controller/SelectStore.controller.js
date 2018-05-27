sap.ui.define([
	"com/publix/servtech/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function(BaseController, MessageToast, JSONModel) {
	"use strict";

	return BaseController.extend("com.publix.servtech.controller.SelectStore", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.publix.servtech.view.SelectStore
		 */
		onInit: function() {
			var oViewModel;

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				validInput: false,
				invalidStore: false,
				invalidStoreMsg: "Invalid Store"
			});
			this.getView().setModel(oViewModel, "storeViewModel");
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.publix.servtech.view.SelectStore
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.publix.servtech.view.SelectStore
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.publix.servtech.view.SelectStore
		 */
		//	onExit: function() {
		//
		//	}

		handleLiveChange: function(oEvent) {
			//This logic only acccepts numbers
			var _oInput = oEvent.getSource();
			var val = _oInput.getValue();
			val = val.replace(/[^\d]/g, "");
			_oInput.setValue(val);
			var oViewModel = this.getView().getModel("storeViewModel");
			if (val.length > 0) {
				oViewModel.setProperty("/validInput", true);
			} else {
				oViewModel.setProperty("/validInput", false);
			}

		},

		_handleStoreValidation: function(errorMsg,oError) {
			var showMsg = oError;
			var storeViewModel = this.getModel("storeViewModel");
			if (oError === undefined){
				showMsg = true;	
			} 
			storeViewModel.setProperty("/invalidStore", oError);
			storeViewModel.setProperty("/invalidStoreMsg", errorMsg);
			if(showMsg){
				MessageToast.show(errorMsg);	
			}
		},

		onPressGoToMaster: function(oEvent) {

			// this.getRouter().navTo("master", {
			// 	storeId: this.byId("storeId").getValue()
			// });

			var that = this;
			var storeID = this.byId("storeId").getValue();
			var appViewModel = this.getModel("appView");
			appViewModel.setProperty("/storeID", storeID);
			// this.getModel().metadataLoaded().then(function() {
			// 	var sObjectPath = this.getModel().createKey("SO_header1Set", {
			// 		Number: sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
			
			
			//Remove the invalid Store Message
			that._handleStoreValidation("",false);

			var oModel = this.getModel();
			oModel.read("/StoreAddressSet('" + storeID + "')", {
				success: function(oData, response) {
					
					//this is an easy way to create a date object with value of now. it takes todays date and present time.
					var now = new Date();
					
					if (oData.StoreClsdDt && (now > oData.StoreClsdDt)) {
						// Store is closed. store 
						that._handleStoreValidation("Store is closed");
					} else {
						appViewModel.setProperty("/ShoppngCntrNm", oData.ShoppngCntrNm);
						appViewModel.setProperty("/StreetAddress", oData.StreetAddress);
						appViewModel.setProperty("/City", oData.City);
						appViewModel.setProperty("/State", oData.State);
						appViewModel.setProperty("/ZipCode", oData.ZipCode);

						that.getRouter().navTo("master", {
							storeId: that.byId("storeId").getValue()
						});
					}
				},
				error: function(e) {
					var smsg = jQuery.parseJSON(e.responseText);
					var errorMsg = smsg.error.message.value;
					that._handleStoreValidation(errorMsg);
				}
			});

		}

	});

});