jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SO_header1Set in the list
// * All 3 SO_header1Set have at least one ToOperation

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/publix/servtech/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/publix/servtech/test/integration/pages/App",
	"com/publix/servtech/test/integration/pages/Browser",
	"com/publix/servtech/test/integration/pages/Master",
	"com/publix/servtech/test/integration/pages/Detail",
	"com/publix/servtech/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.publix.servtech.view."
	});

	sap.ui.require([
		"com/publix/servtech/test/integration/MasterJourney",
		"com/publix/servtech/test/integration/NavigationJourney",
		"com/publix/servtech/test/integration/NotFoundJourney",
		"com/publix/servtech/test/integration/BusyJourney",
		"com/publix/servtech/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});