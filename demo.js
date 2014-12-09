/*
https://rest.ehrscape.com/rest/v1/demographics/ehr/83108075-2765-4cfa-8d37-f03596d664a5/party
https://rest.ehrscape.com/rest/v1/view/83108075-2765-4cfa-8d37-f03596d664a5/faeces
83108075-2765-4cfa-8d37-f03596d664a5
92bfeabc-da97-4163-8b33-ebf3049cc508
https://rest.ehrscape.com/rest/v1/query/?aql=select a_a#origin/value as origin from EHR e contains COMPOSITION a contains OBSERVATION a_a#Faeces where e#ehr_id='83108075-2765-4cfa-8d37-f03596d664a5'
*/


var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getSessionId() {
	var response = $.ajax({
		type: "POST",
		url: baseUrl + "/session?username=" + encodeURIComponent(username) +
		"&password=" + encodeURIComponent(password),
		async: false
	});
	return response.responseJSON.sessionId;
}

function clearInputs(){
	$("#createName").val("");
	$("#createSurname").val("");
	$("#createDateTime").val("");
}

function createEHR() {
	sessionId = getSessionId();

	var givenName = $("#createName").val();
	var familyName = $("#createSurname").val();
	var dateOfBirth = $("#createDateTime").val();

	if (!givenName || !familyName || !dateOfBirth || givenName.trim().length == 0 || familyName.trim().length == 0 || dateOfBirth.trim().length == 0) {
		$("#createMsg").html("<span class='label label-warning fade-in'>Prosim vnesite vse podatke!</span>");
	} else {
		$.ajaxSetup({
			headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
			url: baseUrl + "/ehr",
			type: 'POST',
			success: function (data) {
				var ehrId = data.ehrId;
				var partyData = {
					firstNames: givenName,
					lastNames: familyName,
					dateOfBirth: dateOfBirth,
					partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
				};
				$.ajax({
					url: baseUrl + "/demographics/party",
					type: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(partyData),
					success: function (party) {
						if (party.action == 'CREATE') {
							$("#createMsg").html("<span class='label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
							copyToClipboard(ehrId);
							clearInputs();
						}
					},
					error: function(err) {
						$("#createMsg").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
						console.log(JSON.parse(err.responseText).userMessage);
					}
				});
			}
		});
	}
}

function poizvedi(){
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#poizvediMsg").html("<span class='label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				$("#poizvediMsg").html("<span class='label label-success fade-in'>Uspešno!");
				$("#accordion2").css("display","inline");
				$("#accordion2 h4 a").addClass("collapsed");
				$("#accordion2 .panel-collapse").removeClass("in");

				var party = data.party;
				$("#poizvedbaId").text(party.partyAdditionalInfo[0].value);
				$("#poizvedbaIme").text(party.firstNames);
				$("#poizvedbaPriimek").text(party.lastNames);
				$("#poizvedbaRojstvo").text(party.dateOfBirth);
				$("#osnovnipodatki").click();
			},
			error: function(err) {
				$("#poizvediMsg").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

function copyToClipboard(text) {
	window.prompt("Prosimo, shranite si svojo EHD ID številko za nadaljno uporabo aplikacije: Ctrl+C, Enter", text);
}

function dodajEHRvnos() {
	sessionId = getSessionId();

	var ehrId = $("#ehrIdPoizvedba").val();
	var datumInUra = $("#datumcas").val();
	var barva = $("#barva").val();
	var krv = $("#krv").prop('checked');
	var kons = $("#kons").val();
	var masa = $("#kolicina").val();
	var vol = $("#volumen").val();

	var dngr = ["at0016", "at0020", "at0033", "at0034", "at0022"];
	var constepated = ["at0035", "at0036"];
	var diareja = ["at0039", "at0040","at0041"];

	var stanje = "at0044";
	if(krv == true || dngr.indexOf(barva) >= 0){
		stanje = "at0046";
	}
	else if(constepated.indexOf(kons) >= 0){
		stanje = "at0043";
	}
	else if(diareja.indexOf(kons) >= 0){
		stanje = "at0045";
	}

	if (!ehrId || ehrId.trim().length == 0 || !datumInUra || !barva || !kons || !masa || !vol || !stanje) {
		$("#ehrvnosMsg").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} 
	else {
		$.ajaxSetup({
			headers: {"Ehr-Session": sessionId}
		});

		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Izlocki/example
			"ctx/language": "sl",
			"ctx/territory": "SI",
			"ctx/time": datumInUra,
			"izlocki/faeces:0/barva|code":barva,
			"izlocki/faeces:0/krvavitev":krv,
			"izlocki/faeces:0/konsistenca|code":kons,
			"izlocki/faeces:0/masa|magnitude":masa,
			"izlocki/faeces:0/masa|unit":"gm",
			"izlocki/faeces:0/volumen|magnitude":vol,
			"izlocki/faeces:0/volumen|unit":"ml",
			"izlocki/faeces:0/stanje|code": stanje
		};
		var parametriZahteve = {
			"ehrId": ehrId,
			templateId: 'Izlocki',
			format: 'FLAT',
			committer: 'eSkoljka'
		};
		$.ajax({
			url: baseUrl + "/composition?" + $.param(parametriZahteve),
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(podatki),
			success: function (res) {
				console.log(res.meta.href);
				$("#ehrvnosMsg").html("<span class='obvestilo label label-success fade-in'>Uspešno!</span>");
			},
			error: function(err) {
				$("#ehrvnosMsg").html("<span class='obvestilo label label-danger fade-in'>Napaka!</span>");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

function poizvediZgodovina(){
	if ($("#zgodovina").empty()){
		sessionId = getSessionId();

		var ehrId = $("#preberiEHRid").val();

		var aql="select%20a_a/data[at0001]/origin/value%20as%20origin,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value%20as%20Stanje%20from%20EHR%20e%20contains%20COMPOSITION%20a%20contains%20OBSERVATION%20a_a[openEHR-EHR-OBSERVATION.faeces.v1]%20where%20e/ehr_id='"+ ehrId+"'%20order%20by%20origin%20desc";

		$.ajax({
			url: baseUrl + "/query/?aql=" + aql,
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var result = data.resultSet;

				result.forEach(function(obj){
					var bgcl = "warning";
					if(obj.Stanje == "Kritično"){
						bgcl = "danger";
					}
					else if(obj.Stanje == "Normalno"){
						bgcl = "success";
					}

					var tr = "<tr class='"+bgcl+"'><td>"+obj.origin+"</td><td>"+obj.Stanje+"</td></tr>";
					$("#zgodovina").append(tr);
				});
			}
		});
	}
}