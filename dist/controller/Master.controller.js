/*global history */
sap.ui.define([
	"com/publix/servtech/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"com/publix/servtech/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, History, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.publix.servtech.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {

			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
			
		},
		goToStoreSel: function() {
			this.getRouter().navTo("home");
		},

		onOffline: function(oEvent) {
			var oViewModel = this.getModel("appView");
			oViewModel.setProperty("/offLineMode", true);
		},
		onOnline: function(oEvent) {
			var oViewModel = this.getModel("appView");
			oViewModel.setProperty("/offLineMode", false);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var filters = [];
			var query = oEvent.getParameter("query");
			var filter2 = new sap.ui.model.Filter("ServiceTech", sap.ui.model.FilterOperator.EQ, '494351');
			if (query && query.length > 0) {
				var filter = new sap.ui.model.Filter("Number", sap.ui.model.FilterOperator.Contains, query);
				filters.push(filter);
				filters.push(filter2);
				this._oListFilterState.aSearch = filters;
			} else {
				filters.push(filter2);
				this._oListFilterState.aSearch = filters;
			}
			this._applyFilterSearch();
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		onOpenOfflineInfo: function() {
			var oViewModel = this.getModel("masterView");
			var oImages = oViewModel.getProperty("/offlineImage");
			var oCkin = oViewModel.getProperty("/offlineCheckins");
			var oTs = oViewModel.getProperty("/offlineTravelStarts");
			var oNotes = oViewModel.getProperty("/offlineNotes");
			var oStatus = oViewModel.getProperty("/offlineStatus");

			MessageBox.warning(
				oImages + " image(s) and " + oCkin +
				"checkin information" + oStatus +
				" status updates are stored on this device as internet was not available. Click on 'Send Update' button when you are connected to internet", {
					actions: ["Send Update", sap.m.MessageBox.Action.CANCEL],
					onClose: function(sAction) {
						MessageToast.show("Action selected: " + sAction);
					}
				}
			);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "filter Bar",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Number",
				groupBy: "None",
				storeID: 0
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function(oEvent) {

			var storeID = oEvent.getParameter("arguments").storeId;
			var masterModel = this.getModel("masterView");
			masterModel.setProperty("/storeID", storeID);
			// this.getModel().metadataLoaded().then(function() {
			// 	var sObjectPath = this.getModel().createKey("SO_header1Set", {
			// 		Number: sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
			// this.getModel().read("/StoreAddressSet('" + storeID + "')", {
			// 	success: function(oData, response) {
			// 		masterModel.setProperty("/ShoppngCntrNm", oData.ShoppngCntrNm);
			// 		masterModel.setProperty("/StreetAddress", oData.StreetAddress);
			// 		masterModel.setProperty("/City", oData.City);
			// 		masterModel.setProperty("/State", oData.State);
			// 		masterModel.setProperty("/ZipCode", oData.ZipCode);
			// 	},
			// 	error: function(e) {
			// 		MessageToast.show("Equipment data fetch failed");
			// 	}
			// });

			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				// function(mParams) {
				// 	if (mParams.list.getMode() === "None") {
				// 		return;
				// 	}
				// 	var sObjectId = mParams.firstListitem.getBindingContext().getProperty("Number");
				// 	this.getRouter().navTo("object", {
				// 		storeId: storeID,
				// 		objectId: sObjectId
				// 	}, true);
				// }.bind(this),
				// function(mParams) {
				// 	if (mParams.error) {
				// 		return;
				// 	}
				// 	this.getRouter().getTargets().display("detailNoObjectsAvailable");
				// }.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var storeID = this.getModel("masterView").getProperty("/storeID");
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				storeId: storeID,
				objectId: oItem.getBindingContext().getProperty("Number")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}
	});

});