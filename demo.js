/*
https://rest.ehrscape.com/rest/v1/demographics/ehr/83108075-2765-4cfa-8d37-f03596d664a5/party
https://rest.ehrscape.com/rest/v1/view/83108075-2765-4cfa-8d37-f03596d664a5/faeces
83108075-2765-4cfa-8d37-f03596d664a5
92bfeabc-da97-4163-8b33-ebf3049cc508
https://rest.ehrscape.com/rest/v1/query/?aql=select a_a#origin/value as origin from EHR e contains COMPOSITION a contains OBSERVATION a_a#Faeces where e#ehr_id='83108075-2765-4cfa-8d37-f03596d664a5'
*/

//----------------------------------------------------
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";
//----------------------------------------------------

function getSessionId() {
	var response = $.ajax({
		type: "POST",
		url: baseUrl + "/session?username=" + encodeURIComponent(username) +
		"&password=" + encodeURIComponent(password),
		async: false
	});
	return response.responseJSON.sessionId;
}

var sessionId = getSessionId();

function clearInputs(){
	$("#createName").val("");
	$("#createSurname").val("");
	$("#createDateTime").val("");
}

function createEHRfromForm() {
	var givenName = $("#createName").val();
	var familyName = $("#createSurname").val();
	var dateOfBirth = $("#createDateTime").val();

	createEHR(givenName, familyName, dateOfBirth, true, null);
}

function createEHR(givenName, familyName, dateOfBirth, form, p){
	if (!givenName || !familyName || !dateOfBirth || givenName.trim().length == 0 || familyName.trim().length == 0 || dateOfBirth.trim().length == 0) {
		if(form){
			$("#createMsg").html("<span class='label label-warning fade-in'>Prosim vnesite vse podatke!</span>");
		}
		else{
			console.log("createEHR: neustrezni podatki");
		}
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
							if(form){
								$("#createMsg").html("<span class='label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
								copyToClipboard(ehrId);
								clearInputs();
							}
							else{
								console.log("Uspesno ustvarjen: " + ehrId);
								$("#genPac").append("<option value='"+ehrId+"'>"+givenName+" "+familyName+"</option>");
								
								for(var i = 1; i < 22; i++){
									var datura = new Date("2014-11-01");
									if(p.ime == "Kita"){
										datura.setHours(i);
									}
									else{
										datura.setDate(datura.getDate()+i);
									}
									datura = datura.toISOString();
									dodajEHRvnos(ehrId, datura, p.barva, p.krv, p.kons, "1000", "1536", false);
								}
							}
						}
					},
					error: function(err) {
						if(form){
							$("#createMsg").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
						}
						console.log(JSON.parse(err.responseText).userMessage);
					}
				});
}
});
}
}

function poizvedi(){
	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#poizvediMsg").html("<span class='label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				$(".chart").html("");
				$("#graf").css("display", "none");
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

function dodajEHRvnosForm() {
	var ehrId = $("#ehrIdPoizvedba").val();
	var datumInUra = $("#datumcas").val();
	var barva = $("#barva").val();
	var krv = $("#krv").prop('checked');
	var kons = $("#kons").val();
	var masa = $("#kolicina").val();
	var vol = $("#volumen").val();

	dodajEHRvnos(ehrId, datumInUra, barva, krv, kons, masa, vol, true);
}

function dodajEHRvnos(ehrId, datumInUra, barva, krv, kons, masa, vol, form){
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
		if(form){
			$("#ehrvnosMsg").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
		}
		else{
			console.log("DodajEHRvnos: neustrezni podatki");
			console.log(ehrId + " " + datumInUra + " " + barva + " "+ krv + " " + kons + " " + masa+ " " + vol)
		}
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
				if(form){
					$("#ehrvnosMsg").html("<span class='obvestilo label label-success fade-in'>Uspešno!</span>");
				}
			},
			error: function(err) {
				if(form){
					$("#ehrvnosMsg").html("<span class='obvestilo label label-danger fade-in'>Napaka!</span>");
				}
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}
}

function poizvediZgodovina(){
	if ($("#zgodovina").empty()){
		var ehrId = $("#poizvedbaId").text();

		var aql="select%20a_a/data[at0001]/origin/value%20as%20origin,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0042]/value/value%20as%20Stanje%20from%20EHR%20e%20contains%20COMPOSITION%20a%20contains%20OBSERVATION%20a_a[openEHR-EHR-OBSERVATION.faeces.v1]%20where%20e/ehr_id='"+ ehrId+"'%20order%20by%20origin%20desc";

		$.ajax({
			url: baseUrl + "/query/?aql=" + aql,
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var result = data.resultSet;
				var i = 1;
				result.forEach(function(obj){
					var bgcl = "warning";
					if(obj.Stanje == "Kritično"){
						bgcl = "danger";
					}
					else if(obj.Stanje == "Normalno"){
						bgcl = "success";
					}

					var tr = "<tr id='master"+i.toString()+"'onclick='poizvediDetail("+i+")' data-toggle=\"collapse\" data-target=\"#detail"+i.toString()+"\" class='master "+bgcl+"'><td>"+obj.origin.slice(0,-13)+"</td><td>"+obj.Stanje+"</td></tr>";
					var tr2="<tr id='detail"+i.toString()+"' class='collapse'><td colspan='2'><table class='table table-bordered'><tbody></tbody></table></td></tr>";
					$("#zgodovina").append(tr);
					$("#zgodovina").append(tr2);
					i++;
				});
			}
		});
	}
}

function poizvediDetail(i){
	$("#master"+i).toggleClass("masterdetail");
	$("#detail"+i).toggleClass("masterdetail");
	if($("#detail"+i+" tbody").empty()){
		var ehrId = $("#poizvedbaId").text();
		var datum = $($("#master"+i+" td").get(0)).text();
		var status = $($("#master"+i+" td").get(1)).text();

		var aql="select%20distinct%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0015]/value/value%20as%20Barva,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0023]/value/value%20as%20Krvavitev,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0024]/value/value%20as%20Konsistenca,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0031]/value/magnitude%20as%20Masa_magnitude,%20a_a/data[at0001]/events[at0002]/data[at0003]/items[at0032]/value/magnitude%20as%20Volumen_magnitude%20from%20EHR%20e%20contains%20COMPOSITION%20a%20contains%20OBSERVATION%20a_a[openEHR-EHR-OBSERVATION.faeces.v1]%20where%20e/ehr_id/value='"+ehrId+"'%20and%20a_a/data[at0001]/origin/value='"+datum+"'";

		$.ajax({
			url: baseUrl + "/query/?aql=" + aql,
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var result = data.resultSet;

				$("#detail"+i+" tbody").append("<tr><td class='col-md-3'><strong>Barva:</strong></td><td>"+result[0].Barva+"</td></tr>");
				$("#detail"+i+" tbody").append("<tr><td class='col-md-3'><strong>Krvavitev:</strong></td><td>"+result[0].Krvavitev+"</td></tr>");
				$("#detail"+i+" tbody").append("<tr><td class='col-md-3'><strong>Konsistenca:</strong></td><td>"+result[0].Konsistenca+"</td></tr>");
				$("#detail"+i+" tbody").append("<tr><td class='col-md-3'><strong>Masa:</strong></td><td>"+result[0].Masa_magnitude+" g</td></tr>");
				$("#detail"+i+" tbody").append("<tr><td class='col-md-3'><strong>Volumen:</strong></td><td>"+result[0].Volumen_magnitude+" mL</td></tr>");

				if(status == "Kritično"){
					


				}
			}
		});
	}
}

function poizvediDatumi(){
	$("svg").html("");
	var ehrId = $("#poizvedbaId").text();
	
	var pm = parseInt($("#grafpm").val());
	if(pm > 15){pm=15;}
	if(pm<0){pm=0;}

	var date = $("#grafdatum").val();
	date = new Date(date);
	date.setDate(date.getDate()-pm-1);
	pm = (2*pm) + 1;

	var datumi=[];
	var asindate = new Date(date);
	asindate.setDate(date.getDate());

	for(var i = 0; i < pm; i++){
		date.setDate(date.getDate()+1);

		var dat1 = new Date(date);
		var dat2 = new Date(date);
		dat2.setDate(dat1.getDate()+1);

		dat1 = dat1.toISOString();
		dat2 = dat2.toISOString();
		// dat1 <= x < dat2

		var aql="select%20count(a_a/data[at0001]/origin/value)%20as%20n%20from%20EHR%20e%20contains%20COMPOSITION%20a%20contains%20OBSERVATION%20a_a[openEHR-EHR-OBSERVATION.faeces.v1]%20where%20e/ehr_id='"+ehrId+"'%20and%20a_a/data[at0001]/origin/value%20>=%20'"+dat1+"'%20and%20a_a/data[at0001]/origin/value%20<%20'"+dat2+"'";

		$.ajax({
			url: baseUrl + "/query/?aql=" + aql,
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data2) {
				asindate.setDate(asindate.getDate()+1);
				var rez=data2.resultSet[0].n;
				
				var tmp = new Object();
				tmp["name"]=asindate.toISOString().slice(0,10);
				tmp["value"]=rez;

				datumi.push(tmp);

				if(datumi.length == pm){;
					risiGraf(datumi);
				}
			},
		});
	}
}

function type(d) {
	d.value = +d.value;
	return d;
}

function risiGraf(data){
	$("#graf").css("display","block");
	var margin = {top: 30, right: 40, bottom: 60, left: 50},
	width = 480 - margin.left - margin.right,
	height = 250 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	.rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
	.range([height, 0]);

	var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

	var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left")    
	.ticks(d3.max(data, function(d) { return d.value; }))
	.tickFormat(d3.format("d"))
	.tickSubdivide(0);

	var chart = d3.select(".chart")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	x.domain(data.map(function(d) { return d.name; }));
	y.domain([0, d3.max(data, function(d) { return d.value; })]);

	chart.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
	.selectAll("text")  
	.style("text-anchor", "end")
	.attr("dx", "-.8em")
	.attr("dy", ".15em")
	.attr("transform", function(d) {
		return "rotate(-65)";
	});

	chart.append("g")
	.attr("class", "y axis")
	.call(yAxis);

	chart.append("text")
	.attr("class", "y label")
	.attr("text-anchor", "middle")
	.attr("y", 0 - margin.left)
	.attr("dy", "1em")
	.attr("x", 0 - (height / 2))
	.attr("transform", "rotate(-90)")
	.text("# defekacij");

	chart.selectAll(".bar")
	.data(data)
	.enter().append("rect")
	.attr("class", "bar")
	.attr("x", function(d) { return x(d.name); })
	.attr("y", function(d) { return y(d.value); })
	.attr("height", function(d) { return height - y(d.value)+0.15; })
	.attr("width", x.rangeBand());

	$(window).resize();

}

function generiraj(){
	//function createEHR(givenName, familyName, dateOfBirth, form)
	//function dodajEHRvnos(ehrId, datumInUra, barva, krv, kons, masa, vol, form)
	var data = [{ime:"Matako", priimek:"Kojama", birth:"1939-09-01", barva:"at0017", krv:false, kons:"at0038"},
	{ime:"Okoplota", priimek:"Sigamota", birth:"1945-04-30", barva:"at0017", krv:false, kons:"at0035"},
	{ime:"Kita", priimek:"Muhira", birth:"1889-04-20", barva:"at0019", krv:true, kons:"at0041"}];	

	data.forEach(function(p){
		createEHR(p.ime, p.priimek, p.birth, false, p);
	});
	$("#genbtn").css("display", "none");
	$("#genPac").css("display", "inline-block");
}

$(document).ready(function(){
	$(window).on("resize", function() {
		var aspect = 480 / 250,
		chart = $(".chart");
		var targetWidth = chart.parent().width();
		chart.attr("width", targetWidth);
		chart.attr("height", targetWidth / aspect);
	});

	$("#genPac").change(function(){
		$("#preberiEHRid").val($(this).val());
		$("#poizvedibtn").click();
	});
});