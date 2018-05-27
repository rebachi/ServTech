jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"com/publix/servtech/test/integration/NavigationJourneyPhone",
		"com/publix/servtech/test/integration/NotFoundJourneyPhone",
		"com/publix/servtech/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});