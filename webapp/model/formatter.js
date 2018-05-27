sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		myTime: function(s) {
			var hours = s.substr(2, 2);
			var min = s.substr(5, 2);
			var sec = s.substr(8, 2);
			var amPM = "AM";
			if (hours > 12) {
				hours = hours - 12;
				amPM = "PM";
			}
			return hours + ":" + min + ":" + sec + " " + amPM;

		},
		addressLink: function(storeID) {
			return "/StoreAddressSet('" + storeID + "')";
		},

		priorityStatus: function(sStatus) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			switch (sStatus) {
				case "1":
					return resourceBundle.getText("priorityStatus1");
				case "2":
					return resourceBundle.getText("priorityStatus2");
				case "3":
					return resourceBundle.getText("priorityStatus3");
				case "4":
					return resourceBundle.getText("priorityStatus4");
				default:
					return sStatus;
			}
		},
		priorityText: function(sStatus) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			switch (sStatus) {
				case "1":
					return resourceBundle.getText("priority1");
				case "2":
					return resourceBundle.getText("priority2");
				case "3":
					return resourceBundle.getText("priority3");
				case "4":
					return resourceBundle.getText("priority4");
				default:
					return sStatus;
			}
		}
	};

});