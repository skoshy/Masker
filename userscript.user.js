// ==UserScript==
// @name         Masker
// @icon         https://i.imgur.com/xehDhCN.png
// @namespace    skoshy.com
// @version      0.1.2
// @description  Masks a page when you mouse out of it
// @author       Stefan Koshy
// @updateURL    https://github.com/skoshy/Masker/raw/master/userscript.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

var DEBUG_MODE = false;
var SCRIPT_ID = 'masker';
var SCRIPT_CLASS_ENABLED = 'masked';
var SCRIPT_CLASS_DISABLED = 'unmasked';
var CURRENT_SITE = getCurrentSite();

// From https://gist.github.com/arantius/3123124
// These are replacement functions for GreaseMonkey scripts, but the only work on a single domain instead of being cross domain
// Todo: Implement solution that works cross domain

if (typeof GM_getValue == 'undefined') {
	function GM_getValue(aKey, aDefault) {
		'use strict';
		let val = localStorage.getItem(SCRIPT_ID + aKey);
		if (null === val && 'undefined' != typeof aDefault) return aDefault;
		return val;
	}
}

if (typeof GM_setValue == 'undefined') {
	function GM_setValue(aKey, aVal) {
		'use strict';
		localStorage.setItem(SCRIPT_ID + aKey, aVal);
	}
}

var css = {};
css.defaults = {};

css.overrides = {};
css.overrides.disableUnfocusedTransparency = [];

css.common = {};
css.common.css = `

.masker-element {
z-index: 111111111111111111111111111111111111111111;
position: fixed;
width: 100%;
height: 100%;
top: 0;
left: 0;
background: black !important;
visibility: hidden;
opacity: 0;
transition: visibility .1s ease-in-out, opacity .1s ease-in-out;
}

.`+SCRIPT_CLASS_ENABLED+` .masker-element {
opacity: .90;
visibility: visible;
}

`;
css.none = {};
css.none.css = ``;


function addGlobalStyle(css, className, enabled, id) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }
	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	style.id = id;
	style.className = className;
	head.appendChild(style);
	style.disabled = !enabled;
}

function getCssStyleElements() {
	return document.getElementsByClassName(SCRIPT_ID+'-css');
}

function getBgElements() {
	return document.querySelectorAll('[style*="url("]');
}

function getGradientString() {
	return 'linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.7) 100%), ';
}

function enableStyle() {
	var cssToInclude = '';
	var bgEls = getBgElements();
	var gradientString = getGradientString();

	addGlobalStyle(parseCSS(
		css.common.css + css[CURRENT_SITE].css
	), SCRIPT_ID+'-css', true, SCRIPT_ID+'-css');
}

function disableStyle() {
	var cssEls = getCssStyleElements();

	for (let i = 0; i < cssEls.length; i++) {
		cssEls[i].parentNode.removeChild(cssEls[i]); // remove the element
	}
}

function isStyleEnabled() {
	var cssEl = document.getElementById(SCRIPT_ID+'-css');

	return isTruthy(cssEl);
}

function parseCSS(parsed) {
	for (attribute in css.defaults) {
		exceptionToReplace = new RegExp('{{'+attribute+'}}', 'g');
		parsed = parsed.replace(exceptionToReplace, css['defaults'][attribute]);
	}

	return parsed;
}

document.addEventListener("keydown", function(e) {
	if (e.altKey === true && e.shiftKey === false && e.ctrlKey === false && e.metaKey === false && e.code == 'KeyM') {
		if (isStyleEnabled()) {
			disableStyle();

			if (CURRENT_SITE != 'none') {GM_setValue( 'enabled_'+CURRENT_SITE , false );}
		} else {
			enableStyle();

			if (CURRENT_SITE != 'none') {GM_setValue( 'enabled_'+CURRENT_SITE , true );}
		}
	}
});

function getCurrentSite() {
	var url = document.documentURI;
	var toReturn = 'none';

	return toReturn;
}

function init() {
	var styleEnabled = GM_getValue( 'enabled_'+CURRENT_SITE , true );
	if (CURRENT_SITE == 'none') styleEnabled = false; // don't automatically enable if the site isn't specifically tailored for the script

	if (styleEnabled) {
		enableStyle();
	}

	// add a masker element
	var newdiv = document.createElement("DIV");
	newdiv.classList.add('masker-element');
	document.body.appendChild(newdiv);

	// unfocus / focus transparency effect
	if (css.overrides.disableUnfocusedTransparency.indexOf(CURRENT_SITE) == -1) {
		addEvent(window, "mouseout", function(e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;

			if (from == null) {
				// the cursor has left the building
				hideHtml();
			} else {
				showHtml();
			}
		});
		addEvent(window, "mouseover", function(e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;

			if (from != null) {
				showHtml();
			}
		});
	}
}


function hideHtml() {
	document.querySelector('html').classList.add(SCRIPT_CLASS_ENABLED);
}

function showHtml() {
	document.querySelector('html').classList.remove(SCRIPT_CLASS_ENABLED);
}

init();

/*
* Utility functions
*/

function isTruthy(item) {
	return !isFalsy(item);
}

// from https://gist.github.com/skoshy/69a7951b3070c2e2496d8257e16d7981
function isFalsy(item) {
	if (
		!item
		|| (typeof item == "object" && (
			Object.keys(item).length == 0 // for empty objects, like {}, []
			&& !(typeof item.addEventListener == "function") // omit webpage elements
		))
	)
		return true;
	else
		return false;
}

function addEvent(obj, evt, fn) {
	if (obj.addEventListener) {
		obj.addEventListener(evt, fn, false);
	}
	else if (obj.attachEvent) {
		obj.attachEvent("on" + evt, fn);
	}
}