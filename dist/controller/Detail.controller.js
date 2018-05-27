/*global location */
sap.ui.define([
	"com/publix/servtech/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Fragment',
	"com/publix/servtech/model/formatter",
	"sap/m/MessageToast",
	"com/publix/servtech/model/pouchdb",
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/m/MessageBox"
], function(BaseController, JSONModel, Fragment, formatter, MessageToast, pouchDB, MessagePopover, MessagePopoverItem, MessageBox) {
	"use strict";

	return BaseController.extend("com.publix.servtech.controller.Detail", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			window.oView = this.getView();
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				editable: false,
				checkin: false,
				barCodeVerifiedStatus: true, //this variable desideds the visibility of the status text
				barCodeVerifiedText: "Not Verified", //this variable desideds the text of the status /verified/updated
				barCodeScanned: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			//oView = this.getView(); //ignore thhe error

			// var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			// var oMessageManager = sap.ui.getCore().getMessageManager();

			// oMessageManager.registerMessageProcessor(oMessageProcessor);

			// oMessageManager.addMessages(
			// 	new sap.ui.core.message.Message({
			// 		message: "Something wrong happened",
			// 		type: sap.ui.core.MessageType.Error,
			// 		processor: oMessageProcessor
			// 	})
			// );

			//Prepare the IndexDB
			//this.prepareIDB();
			this.preparePouchDB();
		},

		onOpenOfflineInfo: function() {
			var oViewModel = this.getModel("masterView");
			// var oImages = oViewModel.getProperty("/offlineImage");
			// var oCkin = oViewModel.getProperty("/offlineCheckins");
			// var oTs = oViewModel.getProperty("/offlineTravelStarts");
			// var oNotes = oViewModel.getProperty("/offlineNotes");
			// var oStatus = oViewModel.getProperty("/offlineStatus");
			var that = this;
			//var details1  = this.showTodos();
			MessageBox.warning(
				"Some updates are stored on this device as internet was not available. Click on 'Sync' button when you are connected to internet", {
					actions: ["Sync",  "Show", sap.m.MessageBox.Action.OK],
			//		details: details1,
					onClose: function(sAction) {
						if (sAction.indexOf("Show")>-1) {
							that.showTodos();
							// that.ServTechOffline.allDocs({
							// 	include_docs: true,
							// 	descending: true
							// }, function(err, doc) {
							// 	var text = "";
							// 	for (var i = 0, len = doc.rows.length; i < len; i++) {
							// 		var string = doc.rows[i].doc.orderNo + " " + doc.rows[i].doc.type + " " + doc.rows[i].doc.value;
							// 		text += string;
							// 	}
							// 	MessageToast.show(text);
							// });
						} else if (sAction.indexOf("Sync")>0) {
							that.sendOfflineUpdates();
							// that.ServTechOffline.allDocs({
							// 	include_docs: true,
							// 	descending: true
							// }, function(err, doc) {
							// 	var text = "";
							// 	for (var i = 0, len = doc.rows.length; i < len; i++) {
							// 		var string = doc.rows[i].doc.orderNo + " " + doc.rows[i].doc.type + " " + doc.rows[i].doc.value;
							// 		text += string;
							// 	}
							// 	MessageToast.show(text);
							// });
						}
						//sAction.indexOf("how")
					}
				}
			);
		},

		sendOfflineUpdates: function() {
			var that = this;
			this.ServTechOffline.allDocs({
				include_docs: true,
				descending: true
			}, function(err, doc) {
				var text = "";
				var offline =true;
				for (var i = 0, len = doc.rows.length; i < len; i++) {
					if(doc.rows[i].doc.type === "Status"){
						that.updateStatusServiceCall(doc.rows[i].doc.value,doc.rows[i].doc.orderNo,true);
					}
					// var string = doc.rows[i].doc.orderNo + " " + doc.rows[i].doc.type + " " + doc.rows[i].doc.value;
					// text += string;
				}
				MessageToast.show(text);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/*        Checkin Check out */
		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onTravelStart: function(evt) {
			// Set page as Busy using busyIndicator. unset it in geoError and Geo Success
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/clickType", "T");
			window.thatis = this;

			//var ckinckout = this.getView().byId("ckinckout_bt");
			//var OrderNumber = this.getView().byId("orderNum");
			//var oModel = this.getOwnerComponent().getModel();

			navigator.geolocation.getCurrentPosition(this.onGeoSuccess, this.onGeoError, {
				enableHighAccuracy: true
			});

		},
		onCkinCkoutBtnPress: function(evt) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/clickType", "C");

			//var oViewModel = this.getModel("detailView");
			window.thatis = this;
			//var ID = evt.getSource().getId();
			var ckinckout = evt.getSource();
			//var OrderNumber = this.getView().byId("orderNum");
			//var oModel = this.getOwnerComponent().getModel();

			navigator.geolocation.getCurrentPosition(this.onGeoSuccess, this.onGeoError, {
				enableHighAccuracy: true
			});

			//On Check In end the Travel.05/07/2018  cp00807
			if (ckinckout.getPressed()) {
				var oViewModel = this.getModel("detailView");
				oViewModel.setProperty("/checkin", true);
				// var ckinckout2 = this.byId("travelStart");
				// ckinckout2.setVisible(false);

				//ckinckout.setText("Check Out");

				//as this will also send the location do it with a delay
				//setTimeout(ckinckout2.firePress(), 1000);

			} else {
				var oViewModel = this.getModel("detailView");
				oViewModel.setProperty("/checkin", false);
				//ckinckout.setText(this.getResourceBundle().getText("Checkin"));
			}

			// if (ckinckout2.getPressed()) {
			// 	ckinckout2.setText("Travel End");
			// } else {
			// 	ckinckout2.setText("Travel Start");
			// }
		},
		onSemanticcpyEID: function(oEvent) {
			var copyText = this.getView().getBindingContext().getProperty("Equipment");
			if ((typeof cordova === "undefined") || (typeof cordova.plugins.clipboard === "undefined")) {
				/*This is desktop. So use the Desktop Clipboard  */

				//Create a Temp textarea to hold the value.
				// const el = document.createElement('textarea');
				// el.value = copyText;
				// document.body.appendChild(el);
				// el.select();
				// document.execCommand('copy');
				// document.body.removeChild(el);

				// MessageToast.show("Equipment Number: " + copyText + " is copied to Clip Baord. Now you can pase this value any where");
			} else {
				cordova.plugins.clipboard.copy(copyText);
				MessageToast.show("Equipment sNumber: " + copyText + " is copied to Clip Baord. Now you can pase this value any where");
			}
		},
		onGeoSuccess: function(position) {
			//MessageToast.show("Error in getting location : " + error.message);
			//var OrderNumber = window.thatis.getView().byId("objectHeader").getTitle();

			var OrderNumber = window.thatis.getView().getBindingContext().getProperty("Number");
			var oModel = window.thatis.getView().getModel();

			var oViewModel = window.thatis.getModel("detailView");
			var clickType = oViewModel.getProperty("/clickType");

			var oEntry = {};
			// Check Metadata and the payload parameterters should match the properties of the entitySet
			oEntry.Orderid = OrderNumber;
			oEntry.Longitude = position.coords.longitude + "";
			oEntry.Latitude = position.coords.latitude + "";
			oEntry.Type = clickType;
			/*use this */
			//oEntry.LongitudeTs = "" + position.timestamp;
			//oEntry.LongitudeTs = "" + position.timestamp;

			//oEntry.LongitudeTs = "" + Date.now();
			//oEntry.LongitudeTs = "" + Date.now();

			oModel.create("/SO_header1Set('" + oEntry.Orderid + "')/Header2Location", oEntry, {
				method: "POST",
				success: function(data) {

					// if(clickType){

					// }else {
					// 	var oViewModel = window.thatis.getModel("detailView");
					// 	var clickType = oViewModel.getProperty("/clickType");
					// }
					var MessageToastMsg = "";
					var oViewModel = window.thatis.getModel("detailView");
					var clickType = oViewModel.getProperty("/clickType");

					if ("C" === clickType) {
						var evtBut = window.thatis.byId("ckinckout_bt");
						if (evtBut.getPressed()) {
							evtBut.setText(window.thatis.getResourceBundle().getText("Checkout"));
							MessageToastMsg = window.thatis.getResourceBundle().getText("Checkin");
							oViewModel.setProperty("/checkin", true);
						} else {
							evtBut.setText(window.thatis.getResourceBundle().getText("Checkin"));
							MessageToastMsg = window.thatis.getResourceBundle().getText("Checkout");
							oViewModel.setProperty("/checkin", false);
						}
					} else {
						var evtBut = window.thatis.byId("travelStart")
						if (evtBut.getPressed()) {
							evtBut.setText(window.thatis.getResourceBundle().getText("TravelStop"));
							MessageToastMsg = window.thatis.getResourceBundle().getText("TravelSart");
						} else {
							evtBut.setText(window.thatis.getResourceBundle().getText("TravelSart"));
							MessageToastMsg = window.thatis.getResourceBundle().getText("TravelStop");
						}
					}
					MessageToast.show(MessageToastMsg + " recorded successfully!");

					//var ckinckout = window.thatis.getView().byId("ckinckout_bt");
					// if (ckinckout.getPressed()) {
					// 	ckinckout.setText("Check Out");
					// } else {
					// 	ckinckout.setText("Check In");
					// }
					// var travelStart = window.thatis.getView().byId("travelStart");
					// if (travelStart && travelStart.getPressed()) {
					// 	setTimeout(ckinckout2.firePress(), 1000);
					// } 
					//

					oViewModel.setProperty("/busy", false);
				},
				error: function(e) {
					//SAP update Failed
					if (navigator.connection.type == Connection.NONE) {
						navigator.notification.alert("No Intenet Connection available");
						MessageToast.show(
							"Check in failed to update as no internet  connection. But saved your Location, checkin info offline.  Long: " +
							position.coords
							.longitude + " Latitude : " + position.coords.latitude);
					}
					// var ckinckout = window.thatis.getView().byId("ckinckout_bt");
					// if (ckinckout.getPressed()) {
					// 	ckinckout.setText("Check Out");
					// } else {
					// 	ckinckout.setText("Check In");
					// }
					// var travelStart = window.thatis.getView().byId("travelStart");
					// if (travelStart && travelStart.getPressed()) {
					// 	setTimeout(ckinckout2.firePress(), 1000);
					// }
					// 
					var oViewModel = window.thatis.getModel("detailView");
					oViewModel.setProperty("/busy", false);
				}
			});
		},

		onGeoError: function(error) {

			// var MessageToastMsg = "";
			// var oViewModel = window.thatis.getModel("detailView");
			// var clickType = oViewModel.getProperty("/clickType");

			// if ("C" === clickType) {
			// 	var evtBut = window.thatis.byId("ckinckout_bt");
			// 	if (evtBut.getPressed()) {
			// 		evtBut.setText(window.thatis.getResourceBundle().getText("Checkout"));
			// 		MessageToastMsg = window.thatis.getResourceBundle().getText("Checkin");
			// 	} else {
			// 		evtBut.setText(window.thatis.getResourceBundle().getText("Checkin"));
			// 		MessageToastMsg = window.thatis.getResourceBundle().getText("Checkout");
			// 	}
			// } else {
			// 	var evtBut = window.thatis.byId("travelStart")
			// 	if (evtBut.getPressed()) {
			// 		evtBut.setText(window.thatis.getResourceBundle().getText("TravelStop"));
			// 		MessageToastMsg = window.thatis.getResourceBundle().getText("TravelSart");
			// 	} else {
			// 		evtBut.setText(window.thatis.getResourceBundle().getText("TravelSart"));
			// 		MessageToastMsg = window.thatis.getResourceBundle().getText("TravelStop");
			// 	}
			// }
			// MessageToast.show(MessageToastMsg);

			MessageToast.show("Error in getting the Device location :  " + error.message);
			// var ckinckout = window.thatis.getView().byId("ckinckout_bt");
			// var oViewModel = window.thatis.getModel("detailView");

			// var OrderNumber = window.thatis.getView().getBindingContext().getProperty("Number");
			// var oModel = window.thatis.getView().getModel();
			// var oEntry = {};
			// // Check Metadata and the payload parameterters should match the properties of the entitySet
			// oEntry.Orderid = "000800177169";
			// oEntry.Longitude =  "123";
			// oEntry.Latitude =  "236";
			// oEntry.Type = oViewModel.getProperty("/clickType");
			// /*use this */
			// //oEntry.LongitudeTs = "" + position.timestamp;
			// //oEntry.LongitudeTs = "" + position.timestamp;

			// //oEntry.LongitudeTs = "" + Date.now();
			// //oEntry.LongitudeTs = "" + Date.now();

			// oModel.create("/SO_header1Set('" + oEntry.Orderid + "')/Header2Location", oEntry, {
			// 	method: "POST",
			// 	success: function(data) {
			// 		// MessageToast.show("Check in Success!. FYI. Location got as Long: " + position.coords.longitude + " Latitude : " + position.coords
			// 		// 	.latitude);
			// 		//var ckinckout = window.thatis.getView().byId("ckinckout_bt");
			// 		// if (ckinckout.getPressed()) {
			// 		// 	ckinckout.setText("Check Out");
			// 		// } else {
			// 		// 	ckinckout.setText("Check In");
			// 		// }
			// 		// var travelStart = window.thatis.getView().byId("travelStart");
			// 		// if (travelStart && travelStart.getPressed()) {
			// 		// 	setTimeout(ckinckout2.firePress(), 1000);
			// 		// } 
			// 		//
			// 		var oViewModel = this.getModel("detailView");
			// 		oViewModel.setProperty("/busy", false);
			// 	},
			// 	error: function(e) {
			// 		//SAP update Failed
			// 		if (navigator.connection.type == Connection.NONE) {
			// 			navigator.notification.alert("No Intenet Connection available");
			// 			MessageToast.show(
			// 				"Check in failed to update as no internet  connection. But saved your Location, checkin info offline.  Long: " + position.coords
			// 				.longitude + " Latitude : " + position.coords.latitude);
			// 		}
			// 		//var ckinckout = window.thatis.getView().byId("ckinckout_bt");
			// 		// if (ckinckout.getPressed()) {
			// 		// 	ckinckout.setText("Check Out");
			// 		// } else {
			// 		// 	ckinckout.setText("Check In");
			// 		// }
			// 		// var travelStart = window.thatis.getView().byId("travelStart");
			// 		// if (travelStart && travelStart.getPressed()) {
			// 		// 	setTimeout(ckinckout2.firePress(), 1000);
			// 		// }
			// 		// 

			// 		oViewModel.setProperty("/busy", false);
			// 	}
			// });

			// if (ckinckout.getPressed()) {
			// 	ckinckout.setText("Check Out");
			// } else {
			// 	ckinckout.setText("Check In");
			// }
			// var travelStart = window.thatis.getView().byId("travelStart");
			// if (travelStart.getPressed()) {
			// 	travelStart.setText("Travel End");
			// } else {
			// 	travelStart.setText("Travel Start");
			// }
			var oViewModel = window.thatis.getModel("detailView");
			oViewModel.setProperty("/busy", false);
		},

		/*       end of Checkin Check out */

		barcodeValidate: function(barCodeScanned) {
			var barCodefromSO = this.getView().getBindingContext().getProperty("Equipment");
			var oViewModel = this.getModel("detailView");
			if (barCodeScanned === barCodefromSO) {
				MessageToast.show('Barcode verified Manually');
				oViewModel.setProperty("/barCodeVerifiedText", "Verified");
				oViewModel.setProperty("/barCodeVerified", true);
			} else {
				oViewModel.setProperty("/barCodeVerifiedText", "mismatch");
				oViewModel.setProperty("/barCodeVerified", false);
				this.getequipDialog();
			}
		},

		/*        Barcode start */
		equipmentMismatchSubmit: function(oEvent) {
			var barCodefromSO = this.getView().getBindingContext().getProperty("Equipment");
			var oViewModel = this.getModel("detailView");
			var barCodeScanned = oViewModel.getProperty("/barCodeScanned");
			oViewModel.setProperty("/barCodeVerifiedText", "Updated");
			oViewModel.setProperty("/barCodeVerifiedStatus", true);
			var ePath = this.getView().getBindingContext().getPath("Equipment")
			var oModel = this.getModel();
			oModel.setProperty(ePath, barCodeScanned);
			oEvent.getSource().getParent().close();
		},
		barcodeManualSubmit: function(oEvent) {
			var sText = this.byId('barcodeManual').getValue();
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/barCodeScanned", sText);
			this.barcodeValidate(sText);
			oEvent.getSource().getParent().close();
		},
		oDialogClose: function(oEvent) {
			oEvent.getSource().getParent().close();
		},
		destroyMe: function(oEvent) {
			oEvent.getSource().destroy;
		},
		enableSubmitDlg: function(oEvent) {
			var sText = oEvent.getParameter('value');
			this._getbarCodeDialog().getBeginButton().setEnabled(sText.length > 0);
		},
		reScan: function(oEvent) {
			this._getbarCodeDialog().close();
			this.onBarcodePress();
		},
		_getbarCodeDialog: function() {

			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment(oView.getId(), "com.publix.servtech.view.Barcode", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		getequipDialog: function() {
			this._getequipDialog().open();
		},
		_getequipDialog: function() {

			// create dialog lazily
			if (!this._oequipDialog) {
				// create dialog via fragment factory
				this._oequipDialog = sap.ui.xmlfragment(oView.getId(), "com.publix.servtech.view.Equipment", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oequipDialog);
			}
			return this._oequipDialog;
		},
		getBarCodeDialog: function() {
			this._getbarCodeDialog().open();
		},

		// var oDialog = this.getView().byId("barcodeDialog");
		// 		// create dialog lazily
		// 		if (!oDialog) {
		// 			// create dialog via fragment factory
		// 			this.oDialog = sap.ui.xmlfragment(
		// 			// connect dialog to view (models, lifecycle)
		// 			oView.addDependent(oDialog);
		// 		}

		// 		oDialog.open();

		onBarcodePress: function() {
			window.thatis = this;
			if (typeof cordova === "undefined" || typeof cordova.plugins === "undefined" || typeof cordova.plugins.barcodeScanner ===
				"undefined" || navigator.connection.type == Connection.NONE) {
				//MessageToast.show("Bar code Scanner is not available.");
				this.getBarCodeDialog();
			} else {
				cordova.plugins.barcodeScanner.scan(
					function(result) {
						//var equipoDataModel = window.oView.getModel("equipment");
						// equipoDataModel.read("/EquipmentDisplayHeaderSet", {
						// 	filters: [new sap.ui.model.Filter({
						// 		path: 'Equipment',
						// 		operator: sap.ui.model.FilterOperator.EQ,
						// 		value1: result.text + ""
						// 	})],
						// 	success: function(oData, response) {
						// 		var oJSONModel = new sap.ui.model.json.JSONModel();
						// 		oJSONModel.setDefaultBindingMode("TwoWay");
						// 		oJSONModel.setData({
						// 			modelData: oData.results
						// 		});
						// 		var oTable = window.oView.byId("repairList");
						// 		oTable.setModel(oJSONModel, "oJSONModel");

						// 	},
						// 	error: function(e) {
						// 		MessageToast.show("Equipment data fetch failed");
						// 	}
						// });
						var barCodeScanned = result.text;
						var oViewModel = window.thatis.getModel("detailView");
						oViewModel.setProperty("/barCodeScanned", barCodeScanned);
						//this.barcodeValidate(barCodeScanned);

						var barCodefromSO = window.thatis.getView().getBindingContext().getProperty("Equipment");

						if (barCodeScanned === barCodefromSO) {
							MessageToast.show('Barcode verified Manually' + barCodeScanned);
							oViewModel.setProperty("/barCodeVerifiedText", "Verified");
							oViewModel.setProperty("/barCodeVerified", true);
						} else {
							oViewModel.setProperty("/barCodeVerifiedText", "mismatch");
							oViewModel.setProperty("/barCodeVerified", false);
							window.thatis.getequipDialog();
						}
						//MessageToast.show(result.text);
					},
					function(error) {
						if (navigator.connection.type == Connection.NONE) {
							navigator.notification.alert("No Intenet Connection available");
						} else {
							MessageToast.show("Sorry, barcodescanner Error!!" + error);
						}
					}
				);
			}
		},

		getEquipmentHistory: function(oEvent) {
			// var equipID = this.byId("equipID").getText();
			// var equipoDataModel = window.oView.getModel("equipment");
			// equipoDataModel.read("/EquipmentDisplayHeaderSet", {
			// 	filters: [new sap.ui.model.Filter({
			// 		path: 'Equipment',
			// 		operator: sap.ui.model.FilterOperator.EQ,
			// 		value1: equipID + ""
			// 	})],
			// 	success: function(oData, response) {
			// 		var oJSONModel = new sap.ui.model.json.JSONModel();
			// 		oJSONModel.setDefaultBindingMode("TwoWay");
			// 		oJSONModel.setData({
			// 			modelData: oData.results
			// 		});
			// 		// var oTable = window.oView.byId("EquipementHistory");
			// 		// oTable.setModel(oJSONModel, "oJSONModel");
			// 		// oTable.setVisible(true);
			// 		// var oTable1 = window.oView.byId("repairList1");
			// 		// oTable1.setModel(oJSONModel);
			// 		// sap.ui.getCore().setModel(oJSONModel, "equipment2");

			// 	},
			// 	error: function(e) {
			// 		MessageToast.show("Equipment data fetch failed");
			// 	}
			// });

			//var objectId = this.byId("orderID").getText();
			this.getRouter().navTo("repairHistory", {
				storeId: "123",
				objectId: this.getView().getBindingContext().getProperty("Number"),
				equipID: this.getView().getBindingContext().getProperty("Equipment")
			});
		},

		//model.read("/TimeAccountCollection", {
		// filters: la_filters			
		// 	 filters : [ { path : 'Equipment', operator : 'EQ', value1 : equipID}

		// },

		//});

		/* end of Barcode */

		/* Camera Start */
		onAddPhotoBtnPress: function() {
			this.getRouter().navTo("photos", {
				storeId: "123",
				objectId: this.getView().getBindingContext().getProperty("Number")
			});

		},

		updateStatus: function(oevt) {
			var newStatus = oevt.getSource().getSelectedItem().getKey();
			var OrderNumber = this.getView().getBindingContext().getProperty("Number");
			// var oEntry = {};
			// oEntry.Number = OrderNumber;
			// oEntry.Status = newStatus;
			// this.getModel().update("/SO_header1Set('" + oEntry.Number + "')", oEntry, {
			// 	// method: "PUT",
			// 	success: this._handleUpdateStatusSuc.bind(this, newStatus), //this is to bind the "This"
			// 	error: this._handleUpdateStaErr.bind(this, newStatus)
			// });
			this.updateStatusServiceCall(newStatus, OrderNumber);
		},
		
		updateStatusServiceCall: function(newStatus,OrderNumber,offline) {
			var oEntry = {};
			oEntry.Number = OrderNumber;
			oEntry.Status = newStatus;
			this.getModel().update("/SO_header1Set('" + oEntry.Number + "')", oEntry, {
				// method: "PUT",
				success: this._handleUpdateStatusSuc.bind(this, newStatus,offline), //this is to bind the "This(Controller)"
				error: this._handleUpdateStaErr.bind(this, newStatus,offline)
			});
		},
		
		

		/**
		 * Error and success handler for the update Status action.
		 * @param {string} data Success method returned from Odata update
		 * @private
		 */
		_handleUpdateStatusSuc: function(data,offline) {
			MessageToast.show("Status Saved Successfully!.");
			if(offline){
				//offline status update is success so remove from the DB
			}
			// var newStatus = data;
			// var OrderNumber = this.getView().getBindingContext().getProperty("Number");
			// var newItem = {
			// 	_id: new Date().toISOString(),
			// 	orderNo: OrderNumber,
			// 	type: 'Status',
			// 	value: newStatus
			// };
			//this.writetoDB(newItem);

			//this.addtoDB(newItem);
		},
		/**
		 * Error handler for the update Status action.
		 * @param {string} newStatus the new Status to save
		 * @param {oError} Error method returned from Odata update
		 * @private
		 */
		_handleUpdateStaErr: function(newStatus, offline, oError) {
			if(offline){
				//offline status update is success so do not add to DB. The entry is already there.
				
			}
			
			
			if (oError.statusCode === 0) {
				var oAppModel = this.getModel("appView");
				oAppModel.setProperty("/offLineMode", true);

				// Increase the offlineStatus Counter
				var ostat = oAppModel.getProperty("/offlineStatus");
				oAppModel.setProperty("/offlineStatus", ostat + 1);

				//this.writetoDB(newItem);

				this.addtoDB('Status', newStatus);
				//window.localStorage.setItem("status", newStatus);
			}
			//Handle Offline
			//Set Offline mode

			// if (navigator.connection.type == Connection.NONE) {
			// 	navigator.notification.alert("No Intenet Connection available");
			// 	MessageToast.show(
			// 		"failed to update status as no internet  connection. But saved the info offline. Click Sync when you are online");
			// }
			// MessageToast.show(
			// 	"failed to update status. Please Try again");
		},

		// makeStatusEditable: function() {
		// 	this.byId("techStatus").setEnabled(true);
		// 	var oViewModel = this.getModel("detailView");
		// 	var s = oViewModel.getProperty("/editable");
		// 	oViewModel.setProperty("/editable", !s);
		// 	//oViewModel.ref
		// },

		// makeStatusDisabled: function() {
		// 	this.byId("techStatus").setEnabled(false);
		// 	var oViewModel = this.getModel("detailView");
		// 	var s = oViewModel.getProperty("/editable");
		// 	oViewModel.setProperty("/editable", !s);
		// },

		onPhotoDataSuccess: function(imageData) {
			//imageData="/9j/4AAQSkZJRgABAQEAYABgAAD/4RDERXhpZgAATU0AKgAAAAgABAE7AAIAAAAbAAAISodpAAQAAAABAAAIZpydAAEAAAA2AAAQhuocAAcAAAgMAAAAPgAAAAAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEJoYXNrYXIgQnVycmEgKENvbnRyYWN0b3IpAAAAAeocAAcAAAgMAAAIeAAAAAAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQgBoAGEAcwBrAGEAcgAgAEIAdQByAHIAYQAgACgAQwBvAG4AdAByAGEAYwB0AG8AcgApAAAA/+EKc2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4NCjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iPjxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iLz48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+PGRjOmNyZWF0b3I+PHJkZjpTZXEgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj48cmRmOmxpPkJoYXNrYXIgQnVycmEgKENvbnRyYWN0b3IpPC9yZGY6bGk+PC9yZGY6U2VxPg0KCQkJPC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L3g6eG1wbWV0YT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0ndyc/Pv/bAEMABwUFBgUEBwYFBggHBwgKEQsKCQkKFQ8QDBEYFRoZGBUYFxseJyEbHSUdFxgiLiIlKCkrLCsaIC8zLyoyJyorKv/bAEMBBwgICgkKFAsLFCocGBwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKv/AABEIAQYA5wMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAA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"
			var imageId = window.oView.byId("myImage");
			imageId.setSrc("data:image/jpeg;base64," + imageData);

			var OrderNumber = window.thatis.getView().getBindingContext().getProperty("Number");
			var token;
			jQuery.ajax({

				url: "/sap/opu/odata/sap/ZFIORI_NAVI_ASSOC_SRV/$metadata",

				type: "GET",

				async: false,

				beforeSend: function(xhr) {

					xhr.setRequestHeader("X-CSRF-Token", "Fetch");

					xhr.setRequestHeader("Content-Type", "image/jpeg");

					xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

				},

				success: function(data, textStatus, xhr) {

					token = xhr.getResponseHeader("X-CSRF-Token");

				}

			});

			$.ajaxSetup({

				cache: false

			});

			jQuery.ajax({

				url: "/sap/opu/odata/sap/ZFIORI_NAVI_ASSOC_SRV/SO_header1Set('" + OrderNumber + "')/Header2Image_Nav",

				async: false,

				// dataType: "text",

				cache: false,

				data: imageData,

				type: "POST",

				beforeSend: function(xhr) {

					xhr.setRequestHeader("X-CSRF-Token", token);

					// xhr.setRequestHeader("Content-Type", "application/text;charset=UTF-8");

					// xhr.setRequestHeader("Content-Type", "image/jpeg;charset=UTF-8");

					xhr.setRequestHeader("Content-Type", "image/jpeg");

					xhr.setRequestHeader("slug", "MTR,100001,10412,001");

				},

				success: function(odata) {

					MessageToast.show("Image Upload Success");
					// document.location.reload(true);

				},

				error: function(odata) {
					//window.thatis.addtoDB(type, value);
					if (navigator.connection.type == Connection.NONE) {
						navigator.notification.alert("No Intenet Connection available");
						MessageToast.show("No Intenet Connection available");
					} else {
						MessageToast.show("Image Upload error");
					}
				}
			});

			// var OrderNumber = window.oView.byId("objectHeader").getTitle();
			// var oModel = window.oView.getModel();
			// var oEntry = {};
			// oModel.setHeaders({"Content-Type" : "image/jpeg"});

			// // Check Metadata and the payload parameterters should match the properties of the entitySet
			// oEntry.Orderid = OrderNumber;
			// oEntry.mime_type = "jpg";
			// oEntry.value = imageData;
			// oEntry.fileName = "testImage";
			// oModel.create("/SO_header1Set('" + oEntry.Orderid + "')/Header2Image_Nav", imageData, {
			// 	method: "POST",
			// 	success: function(data) {
			// 		MessageToast.show("Image Upload Success");
			// 	},
			// 	error: function(e) {
			// 		MessageToast.show("Image Upload failed");
			// 	}
			// });

			/* this is UI5 FileUploader plugin which is used for file Upload */
			// var oMdel = window.Photothis.getOwnerComponent().getModel();
			// var orderNum = window.oView.byId("objectHeader").getTitle();
			// //	myImage.setSrc("data:image/jpeg;base64," + imageData);
			// //this.openUploadDialog(oMdel, this.getView().byId("objectHeader").getTitle());
			// oMdel.refreshSecurityToken();
			// // prepare the FileUploader control
			// var oFileUploader = new sap.ui.unified.FileUploader({
			// 	uploadUrl: "/sap/opu/odata/sap/ZFIORI_NAVI_ASSOC_SRV/SO_header1Set('" + orderNum + "')/Header2Image_Nav",
			// 	name: "simpleUploader",
			// 	uploadOnChange: false,
			// 	sendXHR: true,
			// 	useMultipart: false,
			// 	headerParameters: [
			// 		new sap.ui.unified.FileUploaderParameter({
			// 			name: "x-csrf-token",
			// 			value: oMdel.getHeaders()['x-csrf-token']
			// 		})
			// 	],
			// 	uploadComplete: function(oEvent) {
			// 		var sResponse = oEvent.getParameter("response");
			// 		if (sResponse) {
			// 			sap.ui.commons.MessageBox.show("Return Code: " + sResponse, "Response", "Response");
			// 		}
			// 	}
			// });

			// // call the upload method
			// oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
			// 	name: "slug",
			// 	value: imageData
			// }));
			// oFileUploader.upload();
		},

		/* this is cordova FileTransfer plugin which is depreciated */
		// onUpload: function() {
		// 	var imageUri = this.getView().byId("myImage").getSrc();
		// 	var orderNum = this.getView().byId("objectHeader").getTitle();
		// 	var url = encodeURI("/sap/opu/odata/sap/ZFIORI_NAVI_ASSOC_SRV/SO_header1Set('" + orderNum + "')/Header2Image_Nav"); 
		// 	// var params = new Object();
		// 	// params.your_param_name = "something"; //you can send additional info with the file

		// 	var options = new FileUploadOptions();
		// 	options.fileKey = "file"; //depends on the api
		// 	options.fileName = imageUri.substr(imageUri.lastIndexOf('/') + 1);
		// 	options.mimeType = "image/jpeg";
		// 	var params = new Object();
		// 	params.value1 = "test";
		// 	params.value2 = "param";
		// 	options.params = params;
		// 	options.chunkedMode = true; //this is important to send both data and files

		// 	var ft = new FileTransfer();
		// 	ft.upload(imageUri, url, this.onSuccesFileTransfer, this.onErrorFileTransfer, options);
		// },

		// onSuccesFileTransfer: function(success) {
		// 	MessageToast.show("success" + JSON.stringify(success));
		// },
		// onErrorFileTransfer: function(error) {
		// 	MessageToast.show("error" + JSON.stringify(error));
		// },

		// onPhotoDataFail: function(message) {
		// 	MessageToast.show("Failed because: " + message);
		// },

		/* end Camera */
		// handleEquipmentPressed: function() {
		// 	MessageToast.show("More details about Equipment");
		// },

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList")) {
				if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					} else {
						//Display 'Line Items' instead of 'Line items (0)'
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
					}
					oViewModel.setProperty("/lineItemListTitle", sTitle);
				}
			}
		},

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
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("SO_header1Set", {
					Number: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Number,
				sObjectName = oObject.Number,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		// handleAddNotesPress: function(oEvent) {
		// 	if (!this._oPopover) {
		// 		this._oPopover = sap.ui.xmlfragment("com.publix.servtech.view.Notes", this);
		// 		// this._oPopover.bindElement("/ProductCollection/0");
		// 		this.getView().addDependent(this._oPopover);
		// 	}
		// 	this._oPopover.openBy(oEvent.getSource());
		// },

		// handleAddPartsPress: function(oEvent) {
		// 	if (!this._oPopover2) {
		// 		this._oPopover2 = sap.ui.xmlfragment("com.publix.servtech.view.Parts", this);
		// 		// this._oPopover.bindElement("/ProductCollection/0");
		// 		this.getView().addDependent(this._oPopover2);
		// 	}
		// 	this._oPopover2.openBy(oEvent.getSource());
		// },

		handleAddNotesPress: function(oEvent) {
			var objectId = this.getView().getBindingContext().getProperty("Number");
			this.getRouter().navTo("notes", {
				storeId: "123",
				objectId: objectId
			});
		},

		handleAddPartsPress: function(oEvent) {
			var objectId = this.getView().getBindingContext().getProperty("Number");
			this.getRouter().navTo("parts", {
				storeId: "123",
				objectId: objectId
			});
		},

		handleNotesCancel: function(oEvent) {
			this._oPopover.close();
		},

		handlePartsCancel: function(oEvent) {
			this._oPopover2.close();
		},

		handleNotesSave: function(oEvent) {
			var OrderNumber = this.getView().getBindingContext().getProperty("Number");;
			var oModel = this.getView().getModel();
			var oEntry = {};
			// Check Metadata and the payload parameterters should match the properties of the entitySet
			oEntry.OrderId = OrderNumber;
			// oEntry.Order_text = this.byId("addaNote").getValue();

			oEntry.Order_text = "My Comments";

			oModel.create("/SO_header1Set('" + oEntry.OrderId + "')/Header2Notes", oEntry, {
				method: "POST",
				success: function(data) {
					MessageToast.show("Notes Saved Successfully!.");
					this._oPopover.close();
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

			// oModel.create("/NotesSet('" + oEntry.OrderId + "')", oEntry, {
			// 	method: "POST",
			// 	success: function(data) {
			// 		MessageToast.show("Notes Saved Successfully!.");
			// 		this._oPopover.close();
			// 	},
			// 	error: function(e) {
			// 		if (navigator.connection.type == Connection.NONE) {
			// 			navigator.notification.alert("No Intenet Connection available");
			// 			MessageToast.show(
			// 				"failed to update notes as no internet  connection. But saved the info offline. Click Sync when you are online");
			// 		}
			// 		MessageToast.show(
			// 			"failed to update notes. Please Try again");

			// 	}
			// });

		},

		onMessagesButtonPress: function(oEvent) {
			var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						template: new MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},
		goToMaster: function() {
			this.getRouter().navTo("master", {
				storeId: "123"
			});
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = 0;

			if (oLineItemTable) {
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			}

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			if (oLineItemTable) {
				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});
			}

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		// prepareIDB: function() {
		// 	// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		// 	// // DON'T use "var indexedDB = ..." if you're not in a function.
		// 	// // Moreover, you may need references to some window.IDB* objects:
		// 	// window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {
		// 	// 	READ_WRITE: "readwrite"
		// 	// }; // This line should only be needed if it is needed to support the object's constants for older browsers
		// 	// window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

		// 	//Verifying if indexDB is supported by Browser
		// 	if (!window.indexedDB) {
		// 		//indexDB is not supported by Browser
		// 		MessageToast.show("Offline is Not Supported on this Device");
		// 	} else {
		// 		//indexDB is supported by Browser
		// 		MessageToast.show("Offline is Supported on this Device");
		// 	}

		// 	var oController = this;
		// 	var request = window.indexedDB.open("ServTechOffline", 2); // 1(second parameter) is the database version

		// 	request.onerror = function(event) {
		// 		//this is to handle if there is a problem opening DB
		// 		MessageToast.show("Database error: " + event.target.errorCode);
		// 	};
		// 	request.onsuccess = function(event) {
		// 		//this is to handle if it is successfull in opening DB
		// 		oController.ServTechOffline = event.target.result;
		// 	};
		// 	request.onupgradeneeded = function(event) {
		// 		// Save the IDBDatabase interface 
		// 		var db = event.target.result;

		// 		// Create an objectStore for this database
		// 		db.createObjectStore("SOrders", {
		// 			autoIncrement: true
		// 		});
		// 	};
		// },
		// This is to initialize the database. Called from onInit Method
 		preparePouchDB: function() {
			var db = new PouchDB('ServTechOffline');
			var remoteCouch = false;
			this.ServTechOffline = db;
		},

		addtoDB: function(type, value) {
			//Save the Status
			//this.writetoDB("{orderNo:\"123\",status:"+newStatus+"}");
			var OrderNumber = this.getView().getBindingContext().getProperty("Number");
			var newItem = {
				_id: new Date().toString(),
				orderNo: OrderNumber,
				type: type,
				value: value
			};

			this.ServTechOffline.put(newItem, function callback(err, result) {
				if (!err) {
					console.log('Successfully posted a todo!');
				}
				console.log(result);
			});
		},

		showTodos: function() {
			this.ServTechOffline.allDocs({
				include_docs: true,
				descending: true
			}, function(err, doc) {
				var text = "";
				for (var i = 0, len = doc.rows.length; i < len; i++) {
					var string = doc.rows[i].doc.orderNo + " " + doc.rows[i].doc.type + " " + doc.rows[i].doc.value;
					text += string;
				}
				//return text;
				MessageToast.show(text);
			});
		},
		
		deleteRecord: function(){
			this.ServTechOffline.remove(doc);
			console.log("Deleted the records from offline DB"+doc);
		},
		
		deleteRecordAll:function(){
			this.ServTechOffline.allDocs({
				include_docs: true,
				descending: true
			}, function(err, doc) {
				var text = "";
				for (var i = 0, len = doc.rows.length; i < len; i++) {
					this.ServTechOffline.remove(doc);
					console.log("Deleted the records from offline DB"+doc);
				}
				console.log("Deleted All Records from offline DB");
			});
			
		}

		// writetoDB: function(data) {
		// 	var transaction = this.ServTechOffline.transaction(["SOrders"], "readwrite");
		// 	var objectStore = transaction.objectStore("SOrders");
		// 	objectStore.put(data);
		// }

	});

});