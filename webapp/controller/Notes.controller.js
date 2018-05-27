sap.ui.define([
	"com/publix/servtech/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, MessageToast) {
	"use strict";

	return BaseController.extend("com.publix.servtech.controller.Notes", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.publix.servtech.view.Notes
		 */
		onInit: function() {

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.setModel(oViewModel, "notesView");

			this.getRouter().getRoute("notes").attachPatternMatched(this._onObjectMatched, this);

		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.publix.servtech.view.Notes
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.publix.servtech.view.Notes
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.publix.servtech.view.Notes
		 */
		//	onExit: function() {
		//
		//	}

		handleNotesSave: function(oEvent) {
			var OrderNumber = this.getView().getModel("notesView").getProperty("/Number");

			var oEntry = {};
			// Check Metadata and the payload parameterters should match the properties of the entitySet
			oEntry.OrderId = OrderNumber;
			oEntry.Order_text = this.byId("note").getValue();

			// oModel.create("/SO_header1Set('" + oEntry.OrderId + "')/Header2Notes", oEntry, {
			// 	method: "POST",
			// 	success: function(data) {
			// 		MessageToast.show("Notes Saved Successfully!.");
			// 	},
			// 	error: function(e) {
			// 		if (navigator.connection.type === Connection.NONE) {
			// 			navigator.notification.alert("No Intenet Connection available");
			// 			MessageToast.show(
			// 				"failed to update notes as no internet  connection. But saved the info offline. Click Sync when you are online");
			// 		}
			// 		MessageToast.show(
			// 			"failed to update notes. Please Try again");

			// 	}
			// });
			var oModel = this.getView().getModel();
			var that = this;
			oModel.update("/NotesSet('" + oEntry.OrderId + "')", oEntry, {
				method: "PUT",
				success: function(data) {
					MessageToast.show("Notes Saved Successfully!.");
					var storeID = "123";
					var objectId = that.getModel("notesView").getProperty("/Number");
					//that.onNavBack("",);
					that.getRouter().navTo("object", {
						storeId: storeID,
						objectId: objectId
					});
					that.byId("note").setValue("");
				},
				error: function(e) {
					if (navigator.connection.type == Connection.NONE) {
						navigator.notification.alert("No Intenet Connection available");
						MessageToast.show(
							"failed to update notes as no internet  connection. But saved the info offline. Click Sync when you are online");
					}
					MessageToast.show(
						"failed to update notes. Please Try again");

				}
			});

		},
		_onObjectMatched: function(oEvent) {

			var oViewModel = this.getModel("notesView");
			var objectId = oEvent.getParameter("arguments").objectId;
			oViewModel.setProperty("/Number", objectId);

			var oModel = this.getModel();
			oModel.read("/NotesSet('" + objectId + "')", {
				success: function(oData, response) {
					oViewModel.setProperty("/existingNotes", oData.Order_text);
				},
				error: function(e) {
					var smsg = jQuery.parseJSON(e.responseText);
					var errorMsg = smsg.error.message.value;
					MessageToast.show(errorMsg);
				}
			});

			//oTable = this.getView().byId("EquipementHistory"); //get the reference to your Select control

		}

	});

});