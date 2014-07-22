// ==UserScript==
// @name		Pardus logger script
// @namespace	http://github.com/Tro95/Pardus-Logger
// 
// @description	Enables to share combat/hack/payment logs and missions bullettin board with Pardus Infocenter [ http://code.google.com/p/pardus-infocenter/ ]
// @include http://*.pardus.at/combat_details.php*
// @include http://*.pardus.at/hack.php*
// @include http://*.pardus.at/bulletin_board.php*
// @include http://*.pardus.at/overview_payment_log.php*
// @match http://*.pardus.at/combat_details.php*
// @match http://*.pardus.at/hack.php*
// @match http://*.pardus.at/bulletin_board.php*
// @match http://*.pardus.at/overview_payment_log.php*
// 
// @version	3.0.0
// 
// 			===	Version 1.* Authors ===
// @author	Pio -Orion- siur2@yahoo.com
// @author	Uncledan -Orion- / Larry Legend -Artemis- uncledan@uncledan.it
// @author	Taurvi -Artemis- / Sobkou -Orion- sobkou.pardus@gmail.com
// @author	Aeiri -Artemis- / Jetix -Orion- brad@bcable.net
// 
// 			=== Version 2.* Authors ===
// @author 	Tro (Artemis) / Troo (Orion)	thomas.r.obrien@btinternet.com
// 
// 			=== Version 3.* Authors ===
// @author 	Tro (Artemis) / Troo (Orion)	thomas.r.obrien@btinternet.com
// 		
//  
// ==/UserScript==

// ASCII art made with Doom font at http://patorjk.com/software/taag/

//  _____      _   _   _
// /  ___|    | | | | (_)
// \ `--.  ___| |_| |_ _ _ __   __ _ ___
//  `--. \/ _ \ __| __| | '_ \ / _` / __|
// /\__/ /  __/ |_| |_| | | | | (_| \__ \
// \____/ \___|\__|\__|_|_| |_|\__, |___/
//                              __/ |
//                             |___/

var enableCombatShare   = true;
var enableHackShare     = true;
var hideHackerLocation  = true; //if set to *true* the hacker location won't be shown
var enableMissionsShare = true;
var enablePaymentShare  = true;

var showDebug = false; //if set to *true* debug messages are shown

//  _____
// /  ___|
// \ `--.  ___ _ ____   _____ _ __ ___
//  `--. \/ _ \ '__\ \ / / _ \ '__/ __|
// /\__/ /  __/ |   \ V /  __/ |  \__ \
// \____/ \___|_|    \_/ \___|_|  |___/

var servers = [
	{
		name: "", //the name you want to be displayed in the combo box
		url: "", //the exact url to your Infocenter, no trailing slashes
		accounts: { //the user names you wont to use; to disable a universe, just delete the line, but look twice at commas!!!
					//ATTENTION: if not using EASY script it is suggested to give to these account(s) permissions to send data only
			artemis: {name: "", password: ""}
		},
		autoCombat: true,
		autoLevel: "Confidential"
	}
];


//  _____
// /  __ \
// | /  \/ ___  _ __ ___  _ __ ___   ___  _ __
// | |    / _ \| '_ ` _ \| '_ ` _ \ / _ \| '_ \
// | \__/\ (_) | | | | | | | | | | | (_) | | | |
//  \____/\___/|_| |_| |_|_| |_| |_|\___/|_| |_|

function sltServer_onChange() {
	var btnShare = document.getElementById("btnShare");
	btnShare.disabled = false;
	btnShare.className = "";
}

/**
 * Default Server constructor
 */
function Server() {
	this.name = "";
	this.url = "";
	this.accounts = {
		artemis: {name: "", password: ""},
		orion: {name: "", password: ""},
		pegasus: {name: "", password: ""}
	};
	this.autoCombat = false;
	this.autoLevel = "Confidential";
}

/**
 * Set the Artemis account for the server
 * @param  {String} nameToUse     The username of the account uploading. In some cases this may be a universal 'public' account
 * @param  {String} passwordToUse The hash of the password
 */
Server.prototype.artemis = function(nameToUse, passwordToUse) {
	this.accounts.artemis = {
		name: nameToUse,
		password: passwordToUse
	};
};

/**
 * Set the Orion account for the server
 * @param  {String} nameToUse     The username of the account uploading. In some cases this may be a universal 'public' account
 * @param  {String} passwordToUse The hash of the password
 */
Server.prototype.orion = function(nameToUse, passwordToUse) {
	this.accounts.orion = {
		name: nameToUse,
		password: passwordToUse
	};
};

/**
 * Set the Pegasus account for the server
 * @param  {String} nameToUse     The username of the account uploading. In some cases this may be a universal 'public' account
 * @param  {String} passwordToUse The hash of the password
 */
Server.prototype.pegasus = function(nameToUse, passwordToUse) {
	this.accounts.pegasus = {
		name: nameToUse,
		password: passwordToUse
	};
};

//  _____                 _           _
// /  __ \               | |         | |
// | /  \/ ___  _ __ ___ | |__   __ _| |_ ___
// | |    / _ \| '_ ` _ \| '_ \ / _` | __/ __|
// | \__/\ (_) | | | | | | |_) | (_| | |_\__ \
//  \____/\___/|_| |_| |_|_.__/ \__,_|\__|___/
  
/**
 * Extracts string from the source between the begin and end Regex expressions
 * @param  String 	source The source string
 * @param  String 	begin  Regex expression to match the beginning
 * @param  String 	end    Regex expression to match the end
 * @return String          String inbetween the beginning and ending regexes
 */
function extractStr(source, begin, end) {
	var re = new RegExp(begin, "i");
	var i = source.search(re) + begin.length;
	var str = source.substring(i);
	re = new RegExp(end, "i");
	var j = str.search(re);
	return str.substring(0, j);
}

/**
 * Removes leading and trailing whitespace
 * @param  String 	str The string to perform the trimming on
 * @return String    	The string once trimmed of whitespace
 */
function trim(str) {
	var result = str.replace(/^\s+/, "");
	return result.replace(/\s+$/, "");
}

/**
 * Remove brackets following the name
 * @param  String name 	The name to prepare
 * @return String 		The prepared name to return
 */
function prepareName(name) {
	var i = name.indexOf("(");
	return trim(i == -1 ? name : name.substr(0, i));
}

/**
 * Appends a value to an invisible form holding the log data
 * @param  DocumentElement 	form  	The form to append data to
 * @param  String 			name  	The name of the key to give the data
 * @param  String 			value 	The value of the data
 */
function append_input(form, name, value) {
	var input = document.createElement("input");
	input.type = "hidden";
	input.name = name;
	input.value = value;
	form.appendChild(input);
}

function CombatLog() {

	// The universe the log is on
	this.universe = "";

	// The security level to upload the combat log as
	this.level = "";

	//  Specify what type of log we are
	this.logType = "combat";

	/**
	 * Saves the combat log to the given server
	 * @param  Server  server The server to upload the log to
	 * @param  Boolean isAuto Should we use the default or the automatic log security level?
	 * @return Boolean False on error
	 */
	this.save = function(server, isAuto) {

		// Check to see if isAuto is given, otherwise assign it the default value of false
		if(typeof(isAuto)==='undefined') isAuto = false;

		// What security level should we use?
		if (isAuto) {
			this.level = server.autoLevel;

			// If no autoLevel is given in the server declaration, give it the default value of confidential
			if (this.level == null || this.level === "") {
				this.level = "Confidential";
			}
		} else {
			this.level = document.getElementById("sltLevel").value;
		}

		// The details of the account to upload with
		var account = server.accounts[this.universe];

		// If no account name is present then exit
		if (account.name === "" || account.name === null) {
			return false;
		}

		// If we're automatically uploading the log, ignore any Ship vs NPC logs
		if (isAuto) {
			if (cmbt.type === "Ship vs NPC") {
				return;
			}
		}	

		// Time to make magic happen and submit all the data
		var form = document.getElementById("combatPost");
		
		// If another logging script (or even this one) has already submitted this log once then
		// this form element will already exist. We want to start over again.
		if (form) {
			document.body.removeChild(form);
		}
		
		form = document.createElement("form");
		
		if (!showDebug) {
			form.style.display = "none";
		}

		form.action = server.url + "/combat_add.php";
		form.method = "post";
		form.target = "combatFrame";
		form.id = "combatPost";
		append_input(form, "acc", account.name);
		append_input(form, "pwd", account.password);
		append_input(form, "pid", this.pid);
		append_input(form, "type", this.combatType);
		append_input(form, "when", this.when);
		append_input(form, "universe", this.universe);
		append_input(form, "sector", this.sector);
		append_input(form, "coords", this.coords);
		append_input(form, "attacker", this.attacker);
		append_input(form, "defender", this.defender);
		append_input(form, "outcome", this.outcome);
		append_input(form, "additional", this.additional);
		append_input(form, "level", this.level);
		append_input(form, "data", this.data);

		// Add the form back onto the page
		document.body.appendChild(form);

		var frame = document.getElementById("combatFrame");
		if (!frame) {
			
			frame = document.createElement("iframe");
			frame.name = "combatFrame";
			frame.id = frame.name;

			if (!showDebug) {
				frame.style.display = "none";
			}

			document.body.appendChild(frame);
		}
		
		// Submit it to the logger
		form.submit();
	};

	/**
	 * Gets (and sets) the ID of the player
	 * @return Integer The ID of the player
	 */
	this.getPid = function() {
		this.pid = document.location.search.substring(document.location.search.indexOf("=") + 1);
		return this.pid;
	};

	/**
	 * Gets (and sets) the universe the log is of
	 * @return String  The universe the log is of
	 */
	this.getUniverse = function() {
		this.universe = document.location.hostname.substring(0, document.location.hostname.indexOf("."));
		return this.universe;
	};

	/**
	 * Gets (and sets) the type of combat log (Ship vs Ship, Ship vs NPC etc...),
	 * the time it happened, the name of the attacker & defender and
	 * the outcome of the log
	 */
	this.getCombatHeader = function() {

		// Get the tag containing the header of the log
		// <b>Ship vs NPC<br><br><br>2014-07-22 12:10:23<br>Tro disengaged from battle with Space Maggot</b>
		var elem = document.getElementById("report").previousSibling;
		
		// Skip any empty elements inbetween
		while (elem && !elem.tagName) {
			elem = elem.previousSibling;
		}
		
		// Split each bit of the header up into separate addressable elements
		var values = elem.innerHTML.split(/<br>/i);
		
		// Ship vs Ship, Ship vs NPC, etc...
		this.combatType = values[0];	

		// Raided X resources, credit hacked X credits
		this.additional = values[1];

		// The time of the log
		this.timestamp = new Date(values[values.length - 2].replace(/-/g, "/")).getTime();
		
		// The outcome of the battle
		str = values[values.length - 1];
		
		var delim = null;

		// Handle the combat outcome if it has <font> tags in it
		if (str.search(/font/i) != -1) {

			// Extract the string between <font> tags
			delim = /<font.+font>/i;

			// The <font> tags may contains /'s so use our custom
			// function to extract the string we want
			this.outcome = extractStr(str, ">", "<");
		} else {

			// Identify what the outcome was
			var delims = ["disengaged from battle with", "was defeated by", "defeated", "raided"];
			var outcomes = ["disengaged", "was defeated by", "defeated", "raided"];
			for (var i = 0; i < delims.length; i++) {
				if (str.indexOf(delims[i]) != -1) {
					delim = delims[i];
					this.outcome = outcomes[i];
					break;
				}
			}
		}

		// The attacker and defender in the log
		values = str.split(delim);
		this.attacker = prepareName(values[0]);
		this.defender = prepareName(values[1]);	

	};

	/**
	 * Sets the location of the combat
	 */
	this.getCombatLocation = function() {
		values = extractStr(document.body.innerHTML, "confrontation in ", "]").split(" [");
		this.sector = values[0];
		this.coords = values[1];
	};

	/**
	 * Sets the additional information (credit hacks)
	 */
	this.getAdditional = function() {

		this.data = extractStr(document.body.innerHTML, "cr = \"", "\"");
		
		if (this.additional !== "") {

			// Additional information is coloured, and we want to pass this colour back to the logger
			var tmp = extractStr(document.body.innerHTML, "<br><font color=", "</font>");
			
			// Replace XML-parsable quotes with single quotes so it renders correctly on the logger
			tmp = tmp.replace("&quot;", "'");
			tmp = tmp.replace("&quot;", "'");
			this.additional = "<font color=" + tmp + "</font>";
		}
	};

	this.createLog = function() {
		this.getPid();
		this.getUniverse();
		this.getCombatHeader();
		this.getCombatLocation();
		this.getAdditional();
	};
}

function saveCombat() {
	var log = new CombatLog();

	log.create();
	log.save(servers[document.getElementById("sltServer").selectedIndex]);

}

function addCombatShareBtn() {

	// text
	var div = document.createElement("div");
	var label = document.createElement("b");
	label.appendChild(document.createTextNode("Share combat log at: "));
	div.appendChild(label);

	// Create the dropdown list of possible servers to upload to
	var select = document.createElement("select");
	select.id = "sltServer";
	var option;
	for (var i = 0; i < servers.length; i++) {
		option = document.createElement("option");
		option.text = servers[i].name;
		option.value = i;
		select.appendChild(option);
	}

	// Bind the sltServer_onChange() function to the dropdown list
	select.addEventListener("change", sltServer_onChange, false);
	div.appendChild(select);
	div.appendChild(document.createTextNode(" "));

	// security levels
	var select_level = document.createElement("select");
	select_level.id = "sltLevel";
	var levels = Array("Open", "Confidential", "Admin");
	for (var j in levels) {
		option = document.createElement("option");
		if (levels[j] == "Open") {
			option.selected = "selected";
		}
		option.text = levels[j];
		option.value = levels[j];
		select_level.appendChild(option);
	}
	div.appendChild(select_level);
	div.appendChild(document.createTextNode(" "));

	// share button
	var btnShare = document.createElement("input");
	btnShare.id = "btnShare";
	btnShare.type = "button";
	btnShare.value = "Share";
	btnShare.addEventListener("click", saveCombat, false);
	div.appendChild(btnShare);
	div.appendChild(document.createElement("br"));
	div.appendChild(document.createElement("br"));
	var br = document.getElementsByTagName("br")[1];
	br.parentNode.insertBefore(div, br.nextSibling);

	// Automagically upload the log if it's PvP
	for (var x = 0; x < servers.length; x++) {
		console.log("Trying server " + x + " which is " + servers[x].name);
		if (servers[x].autoCombat) {
			saveCombatByServer(true, servers[x]);
		}
	}

}

if(enableCombatShare && document.URL.indexOf('combat_details.php') >= 0) addCombatShareBtn();