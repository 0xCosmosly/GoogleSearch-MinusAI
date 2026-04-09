// ==UserScript==
// @name         Append -ai to Google Search
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically appends " -ai" to Google search queries to filter out AI results.
// @author       0xCosmosly
// @match        *://www.google.com/*
// @icon         https://www.google.com/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const appendTerm = ' -ai';

    const forms = document.querySelectorAll('form[action="/search"]');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const input = form.querySelector('input[name="q"]');
            if (input && input.value && !input.value.includes(appendTerm.trim())) {
                input.value = input.value.trim() + appendTerm;
            }
        });
    });

    if (window.location.pathname === '/search') {
        const urlParams = new URLSearchParams(window.location.search);
        let query = urlParams.get('q');

        if (query && !query.includes(appendTerm.trim())) {
            query = query.trim() + appendTerm;
            urlParams.set('q', query);
            
            window.location.search = urlParams.toString();
        }
    }
})();
