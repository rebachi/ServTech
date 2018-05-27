sap.ui.define([
	"sap/m/ObjectListItem"
], function(ObjectListItem) {
	"use strict";
	return ObjectListItem.extend("com.publix.servtech.control.ServTechListItem", {
		metadata: {
			aggregations: {
				statuses: {
					type: "sap.m.ObjectStatus"
				}
			}
		},
		onAfterRendering: function() {
			if (sap.m.ObjectListItem.prototype.onAfterRendering) {
				sap.m.ObjectListItem.prototype.onAfterRendering.apply(this, arguments);
			}

			var oList = this.$().find(".sapMLIBContent")[0];

			var content = [];
			this.getStatuses().forEach(function(b) {
				content.push(b);
			});

			for (var i = 0; i < content.length; i++) {
				
				var j = i + 3;
				var strStat = ".sapMObjLBottomRow .sapMObjLAttrRow:nth-child(" + j + ")";
				//Get the Row	
				var varStat = $(oList).find(strStat)[0];
				//var n = $($(content[i].$()[0])[0]);
				//var k = $(n[0]).wrap("<div class='sapMObjLStatusDiv'>");
				var m = $(varStat).find(".sapMObjLAttrDiv")[0];
				$(m).width("50%");
				//varStat[0].appendChild($("<div class='sapMObjLStatusDiv'>"));
				$(varStat).append("<div class='sapMObjLStatusDiv'></div>");
				var n = $(varStat).find(".sapMObjLStatusDiv")[0];
				$(n).append(content[i].$()[0]);
				
			}
		},
		renderer: function(oRM, oControl) { // static function
			sap.m.ObjectListItemRenderer.render(oRM, oControl);
			oControl.getStatuses().forEach(function(b) {
				oRM.renderControl(b);
			});
		}
	});
});