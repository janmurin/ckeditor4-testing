CKEDITOR.plugins.setLang( 'flite', 'nl', {
	TOGGLE_TRACKING: "Wijzigingen bijhouden inschakelen",
	TOGGLE_SHOW: "Schakelen van gevolgd zichtbaarheid van wijzigingen",
	ACCEPT_ALL: "Accepteer alle wijzigingen",
	REJECT_ALL: "Weiger alle wijzigingen",
	ACCEPT_ONE: "Accepteer wijziging",
	REJECT_ONE: "Weiger wijziging",
	START_TRACKING: "Begin met het bijhouden van wijzigingen",
	STOP_TRACKING: "Stop met het volgen van wijzigingen",
	PENDING_CHANGES: "Uw document bevat uitstekende wijzigingen. Verwerk deze alsjeblieft voordat het bijhouden van wijzigingen is uitgeschakeld.",
	HIDE_TRACKED: "Verberg wijzigingen bijhouden",
	SHOW_TRACKED: "Wijzigingen tonen",
	CHANGE_TYPE_ADDED: "toegevoegd",
	CHANGE_TYPE_DELETED: "verwijderd",
	MONTHS: ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
	NOW: "nu",
	MINUTE_AGO: "1 minuut geleden",
	MINUTES_AGO: "%Minutes minuten geleden",
	BY: "door",
	ON: "op",
	AT: "om",
	FLITE_LABELS_DATE: function(day, month, year)
	{
		if(typeof(year) != 'undefined') {
			year = ", " + year;
		}
		else {
			year = "";
		}
		return this.MONTHS[month] + " " + day + year;
	}
});